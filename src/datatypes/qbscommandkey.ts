/** The unique keys for the commands to register in the Qbs extension
 * (which are specified in the `package.json` file). */
export enum QbsCommandKey {
    BuildProduct = 'qbs.buildProduct',
    CancelOperation = 'qbs.cancelOperation',
    CleanProduct = 'qbs.cleanProduct',
    CompileOnly = 'qbs.compileOnly',
    DebugProduct = 'qbs.debugProduct',
    EditBuildConfigurations = 'qbs.editBuildConfigurations',
    EditLaunchConfigurations = 'qbs.editLaunchConfigurations',
    GetProductBuildDirectory = 'qbs.getProductBuildDirectory',
    GetProductExecutablePath = 'qbs.getProductExecutablePath',
    GetProductRunEnvironment = 'qbs.getProductRunEnvironment',
    InstallProduct = 'qbs.installProduct',
    LoadProject = 'qbs.loadProject',
    OpenTextDocument = 'vscode.open',
    OpenTextDocumentAtPosition = 'qbs.openTextDocumentAtPosition',
    RebuildProduct = 'qbs.rebuildProduct',
    ResolveProject = 'qbs.resolveProject',
    ResolveProjectWithForceExecution = 'qbs.resolveProjectWithForceProbesExecution',
    RestartSession = 'qbs.restartSession',
    RestoreProject = 'qbs.restoreProject',
    RunProduct = 'qbs.runProduct',
    SaveProject = 'qbs.saveProject',
    ScanBuildConfigurations = 'qbs.scanBuildConfigurations',
    ScanBuildProfiles = 'qbs.scanBuildProfiles',
    ScanLaunchConfigurations = 'qbs.scanLaunchConfigurations',
    SelectBuildConfiguration = 'qbs.selectBuildConfiguration',
    SelectBuildProduct = 'qbs.selectBuildProduct',
    SelectBuildProfile = 'qbs.selectBuildProfile',
    SelectLaunchConfiguration = 'qbs.selectLaunchConfiguration',
    SelectRunProduct = 'qbs.selectRunProduct',
    StartSession = 'qbs.startSession',
    StartupCppCodeModel = 'qbs.startupCppCodeModel',
    StopSession = 'qbs.stopSession',

    CleanAll = 'qbs.cleanAll',
    GetProfileName = 'qbs.getProfileName',
    GetConfigurationName = 'qbs.getConfigurationName',
    GetPathFromConanBuildInfo = 'qbs.getPathFromConanBuildInfo',
    GetConfigurationCustomProperty = 'qbs.getConfigurationCustomProperty',
    GetBuildDirectory = 'qbs.getBuildDirectory'
}
