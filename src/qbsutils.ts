import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import * as cp from 'child_process';
import * as fs from 'fs';

// From user code.
import { QbsSessionStatus } from './qbssession';
import * as QbsConfig from './qbsconfig';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function enumerateProjects(): Promise<vscode.Uri[]> {
    return await vscode.workspace.findFiles('*.qbs');
}

export async function enumerateBuildProfiles(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        const qbsPath = QbsConfig.fetchQbsPath();
        if (qbsPath.length === 0) {
            reject(undefined);
        } else {
            let qbsShell = `${qbsPath} config --list`;
            const qbsSettingsDirectory = QbsConfig.fetchQbsSettingsDirectory();
            if (qbsSettingsDirectory.length > 0) {
                qbsShell += ' --settings-dir ' + qbsSettingsDirectory;
            }
            cp.exec(qbsShell, (error, stdout, stderr) => {
                if (error) {
                    reject(undefined);
                } else {
                    let profiles: string[] = [];
                    stdout.split('\n').map(function (line) {
                        if (!line.startsWith('profiles'))
                            return;
                        const startIndex = line.indexOf('.');
                        if (startIndex !== -1) {
                            const endIndex = line.indexOf('.', startIndex + 1);
                            if (endIndex != -1) {
                                const profile = line.substring(startIndex + 1, endIndex);
                                if (profiles.indexOf(profile) === -1)
                                    profiles.push(profile);
                            }
                        }
                    });
                    resolve(profiles);
                }
            });
        }
    });
}

export async function enumerateBuildConfigurations(): Promise<string[]> {
    return ['debug', 'release'];
}

export function expandPath(path?: string): string | undefined {
    if (path?.includes('${workspaceFolder}')) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const workspaceFolder = workspaceFolders[0].uri.fsPath;
            path = path.replace('${workspaceFolder}', workspaceFolder);
        }
    }
    return path?.replace(/\\/g, '/');
}

export function sessionStatusName(status: QbsSessionStatus): string {
    switch (status) {
    case QbsSessionStatus.Started:
        return localize('qbs.session.status.started', "started");
    case QbsSessionStatus.Starting:
        return localize('qbs.session.status.started', "starting");
    case QbsSessionStatus.Stopped:
        return localize('qbs.session.status.started', "stopped");
    case QbsSessionStatus.Stopping:
        return localize('qbs.session.status.started', "stopping");
    }
}

export async function ensureQbsExecutableConfigured(): Promise<boolean> {
    const qbsPath = QbsConfig.fetchQbsPath();
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
