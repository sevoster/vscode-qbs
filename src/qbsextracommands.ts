import * as ini from 'ini';
import * as fs from 'fs';
import * as path from 'path';

import { QbsProjectManager } from './qbsprojectmanager';
import { QbsBuildConfigurationManager } from './qbsbuildconfigurationmanager';
import { QbsBuildSystem } from './qbsbuildsystem';

export async function getBuildDirectory(): Promise<string | null> {
    const buildDirectory = QbsBuildSystem.getBuildRootDirectoryPathFromSettings();
    return Promise.resolve(buildDirectory ? buildDirectory : null);
}

export async function getProfileName(): Promise<string | null> {
    const project = QbsProjectManager.getInstance().getProject();
    const profileName = project?.getProfileName();
    return Promise.resolve(profileName ? profileName : null);
}

export async function getConfigurationName(): Promise<string | null> {
    const project = QbsProjectManager.getInstance().getProject();
    const configurationName = project?.getConfigurationName();
    return Promise.resolve(configurationName ? configurationName : null);
}

export async function getConfigurationCustomProperty(property: string): Promise<string | null> {
    let custom_data = undefined;
    const project = QbsProjectManager.getInstance().getProject();
    if (project) {
        const configuration = QbsBuildConfigurationManager.getInstance().findConfiguration(project.getConfigurationName());
        custom_data = configuration ? configuration.custom_properties : undefined;
    }
    return Promise.resolve(custom_data ? custom_data[property] || null : null);
}

export async function getPathFromConanBuildInfo(section: string, option: string): Promise<string | null> {
    const buildDir = await getBuildDirectory();
    if (buildDir) {
        const buildInfoPath = path.join(buildDir, 'conanbuildinfo.txt');
        if (fs.existsSync(buildInfoPath)) {
            const data = ini.parse(fs.readFileSync(buildInfoPath, 'utf-8'));
            if (section in data && option in data[section])
                return Promise.resolve(data[section][option].replaceAll('\\', '/'));
        }
    }
    return Promise.resolve(null);
}
