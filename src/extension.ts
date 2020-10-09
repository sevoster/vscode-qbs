import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import * as fs from 'fs';

// From user code.
import {QbsSessionLogger} from './qbssessionlogger';
import {QbsSession, QbsSessionStatus} from './qbssession';
import {QbsStatusBar} from './qbsstatusbar';
import * as QbsSelectors from './qbsselectors';
import * as QbsUtils from './qbsutils';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

let qbsSessionLogger!: QbsSessionLogger;
let qbsSession!: QbsSession;
let qbsStatusBar!: QbsStatusBar;
let qbsAutoResolveRequired: boolean = false;
let qbsAutoRestartRequired: boolean = false;

async function subscribeCommands(extensionContext: vscode.ExtensionContext) {
    const startSessionCmd = vscode.commands.registerCommand('qbs.startSession', () => {
         qbsSession!.start();
    });
    extensionContext.subscriptions.push(startSessionCmd);

    const stopSessionCmd = vscode.commands.registerCommand('qbs.stopSession', () => {
        qbsSession!.stop();
    });
    extensionContext.subscriptions.push(stopSessionCmd);

    const selectProjectCmd = vscode.commands.registerCommand('qbs.selectProject', () => {
        QbsSelectors.selectProject().then(projectUri => {
            if (projectUri)
                qbsSession!.projectUri = projectUri;
        });
    });
    extensionContext.subscriptions.push(selectProjectCmd);

    const selectProfileCmd = vscode.commands.registerCommand('qbs.selectProfile', () => {
        QbsSelectors.selectProfile().then(profileName => {
            if (profileName)
                qbsSession!.profileName = profileName;
        });
    });
    extensionContext.subscriptions.push(selectProfileCmd);

    const selectConfigurationCmd = vscode.commands.registerCommand('qbs.selectConfiguration', () => {
        QbsSelectors.selectConfiguration().then(configurationName => {
             if (configurationName)
                qbsSession!.configurationName = configurationName;
        });
    });
    extensionContext.subscriptions.push(selectConfigurationCmd);

    const resolveCmd = vscode.commands.registerCommand('qbs.resolve', () => {
        qbsSession!.resolve();
    });
    extensionContext.subscriptions.push(resolveCmd);

    const buildCmd = vscode.commands.registerCommand('qbs.build', () => {
        qbsSession!.build();
    });
    extensionContext.subscriptions.push(buildCmd);

    const cleanCmd = vscode.commands.registerCommand('qbs.clean', () => {
        qbsSession!.clean();
    });
    extensionContext.subscriptions.push(cleanCmd);
}

async function subscribeWorkspaceConfigurationEvents(extensionContext: vscode.ExtensionContext) {
    extensionContext.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('qbs.qbsPath')) {
            autoRestartSession();
        }
    }));
}

async function subscribeSessionEvents(extensionContext: vscode.ExtensionContext) {
    // QBS session status.
    extensionContext.subscriptions.push(qbsSession.onStatusChanged(status => {
        showSessionStatusMessage(status);

        if (status === QbsSessionStatus.Started) {
            autoResolveProject();
        } else if (status === QbsSessionStatus.Stopped) {
            if (qbsAutoRestartRequired) {
                qbsAutoRestartRequired = false;
                qbsSession.start();
            }
        }
    }));
    // QBS session configuration.
    extensionContext.subscriptions.push(qbsSession.onProjectUriChanged(uri => {
        qbsAutoResolveRequired = true;
        autoResolveProject();
    }));
    extensionContext.subscriptions.push(qbsSession.onProfileNameChanged(name => {
        qbsAutoResolveRequired = true;
        autoResolveProject();
    }));
    extensionContext.subscriptions.push(qbsSession.onConfigurationNameChanged(name => {
        qbsAutoResolveRequired = true;
        autoResolveProject();
    }));
    // QBS session logging.
    extensionContext.subscriptions.push(qbsSession.onTaskStarted(result => {
        qbsSessionLogger.handleTaskStarted(result);
    }));
    extensionContext.subscriptions.push(qbsSession.onProjectResolved(result => {
        qbsSessionLogger.handleProjectResolved(result);
    }));
    extensionContext.subscriptions.push(qbsSession.onProjectBuilt(result => {
        qbsSessionLogger.handleProjectBuilt(result);
    }));
    extensionContext.subscriptions.push(qbsSession.onProjectCleaned(result => {
        qbsSessionLogger.handleProjectCleaned(result);
    }));
    extensionContext.subscriptions.push(qbsSession.onProjectInstalled(result => {
        qbsSessionLogger.handleProjectInstalled(result);
    }));
    extensionContext.subscriptions.push(qbsSession.onCommandDescriptionReceived(result => {
        qbsSessionLogger.handleCommandDesctiptionReceived(result);
    }));
    extensionContext.subscriptions.push(qbsSession.onProcessResultReceived(result => {
        qbsSessionLogger.handleProcessResultReceived(result);
    }));
    extensionContext.subscriptions.push(qbsSession.onLogMessageReceived(result => {
        qbsSessionLogger.handleMessageReceived(result);
    }));
}

async function showSessionStatusMessage(status: QbsSessionStatus) {
    const statusName = QbsUtils.sessionStatusName(status);
    await vscode.window.showInformationMessage(localize('qbs.status.info.message',
                                                        `QBS status: ${statusName}`));
}

async function ensureQbsExecutableConfigured(): Promise<boolean> {
    const qbsPath = QbsUtils.fetchQbsPath();
    if (qbsPath.length === 0) {
        vscode.window.showErrorMessage(localize('qbs.executable.missed.error.message',
                                                'QBS executable not set in configuration.'));
        return false;
    } else if (!fs.existsSync(qbsPath)) {
        vscode.window.showErrorMessage(localize('qbs.executable.not-found.error.message',
                                                `QBS executable ${qbsPath} not found.`));
        return false;
    }
    vscode.window.showInformationMessage(localize('qbs.executable.found.info.message',
                                                  `QBS executable found in ${qbsPath}.`));
    return true;
}

async function autoResolveProject() {
    if (qbsAutoResolveRequired && qbsSession?.status === QbsSessionStatus.Started && qbsSession?.projectUri) {
        qbsAutoResolveRequired = false;
        await qbsSession.resolve();
    }
}

async function setupDefaultProject() {
    const projects = await QbsUtils.enumerateProjects();
    if (projects.length) {
        qbsSession.projectUri = projects[0];
    }
}

async function autoRestartSession() {
    if (!await ensureQbsExecutableConfigured()) {
        await qbsSession?.stop();
        return;
    }

    if (qbsSession?.status === QbsSessionStatus.Started
        || qbsSession?.status === QbsSessionStatus.Starting) {
            qbsAutoRestartRequired = true;
            await qbsSession.stop();
    } else if (qbsSession?.status === QbsSessionStatus.Stopping) {
        qbsAutoRestartRequired = true;
    } else if (qbsSession?.status === QbsSessionStatus.Stopped) {
        await qbsSession.start();
    }
}

export async function activate(extensionContext: vscode.ExtensionContext) {
    console.log('Extension "qbs-tools" is now active!');

    // Create all required singletons.
    qbsSessionLogger = new QbsSessionLogger(extensionContext);
    qbsSession = new QbsSession(extensionContext);
    qbsStatusBar = new QbsStatusBar(qbsSession);

    // Subscribe to all required events.
    await subscribeCommands(extensionContext);
    await subscribeWorkspaceConfigurationEvents(extensionContext);
    await subscribeSessionEvents(extensionContext);

    await setupDefaultProject();
    await autoRestartSession();
}

export async function deactivate() {
    qbsStatusBar?.dispose();
    qbsSession?.dispose();
}
