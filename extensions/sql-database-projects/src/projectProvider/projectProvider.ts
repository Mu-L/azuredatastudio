/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
import * as dataworkspace from 'dataworkspace';
import * as sqldbproj from 'sqldbproj';
import * as vscode from 'vscode';
import * as constants from '../common/constants';
import { IconPathHelper } from '../common/iconHelper';
import { SqlDatabaseProjectTreeViewProvider } from '../controllers/databaseProjectTreeViewProvider';
import { ProjectsController } from '../controllers/projectController';
import { Project } from '../models/project';
import { BaseProjectTreeItem } from '../models/tree/baseTreeItem';

export class SqlDatabaseProjectProvider implements dataworkspace.IProjectProvider, sqldbproj.IExtension {
	constructor(private projectController: ProjectsController) {

	}

	/**
	 * Gets the project tree data provider
	 * @param projectFile The project file Uri
	 */
	async getProjectTreeDataProvider(projectFilePath: vscode.Uri): Promise<vscode.TreeDataProvider<BaseProjectTreeItem>> {
		const provider = new SqlDatabaseProjectTreeViewProvider();
		const project = await Project.openProject(projectFilePath.fsPath);
		provider.load([project]);
		return provider;
	}

	/**
	 * Callback method when a project has been removed from the workspace view
	 * @param projectFile The Uri of the project file
	 */
	RemoveProject(projectFile: vscode.Uri): Promise<void> {
		// No resource release needed
		console.log(`project file unloaded: ${projectFile.fsPath}`);
		return Promise.resolve();
	}

	/**
	 * Gets the supported project types
	 */
	get supportedProjectTypes(): dataworkspace.IProjectType[] {
		return [{
			id: constants.emptySqlDatabaseProjectTypeId,
			projectFileExtension: constants.sqlprojExtension.replace(/\./g, ''),
			displayName: constants.emptyProjectTypeDisplayName,
			description: constants.emptyProjectTypeDescription,
			icon: IconPathHelper.colorfulSqlProject
		},
		{
			id: constants.edgeSqlDatabaseProjectTypeId,
			projectFileExtension: constants.sqlprojExtension.replace(/\./g, ''),
			displayName: constants.edgeProjectTypeDisplayName,
			description: constants.edgeProjectTypeDescription,
			icon: IconPathHelper.sqlEdgeProject
		}];
	}

	/**
	 * Create a project
	 * @param name name of the project
	 * @param location the parent directory
	 * @param projectTypeId the ID of the project/template
	 * @returns Uri of the newly created project file
	 */
	async createProject(name: string, location: vscode.Uri, projectTypeId: string): Promise<vscode.Uri> {
		const projectFile = await this.projectController.createNewProject({
			newProjName: name,
			folderUri: location,
			projectTypeId: projectTypeId
		});

		return vscode.Uri.file(projectFile);
	}

	/**
	 * Gets the supported project types
	 */
	get projectActions(): (dataworkspace.IProjectAction | dataworkspace.IProjectActionGroup)[] {
		const addItemAction: dataworkspace.IProjectAction = {
			id: constants.addItemAction,
			icon: IconPathHelper.add,
			run: (treeItem: dataworkspace.WorkspaceTreeItem) => this.projectController.addItemPromptFromNode(treeItem)
		};

		const schemaCompareAction: dataworkspace.IProjectAction = {
			id: constants.schemaCompareAction,
			icon: IconPathHelper.schemaCompare,
			run: (treeItem: dataworkspace.WorkspaceTreeItem) => this.projectController.schemaCompare(treeItem)
		};

		const buildAction: dataworkspace.IProjectAction = {
			id: constants.buildAction,
			icon: IconPathHelper.build,
			run: (treeItem: dataworkspace.WorkspaceTreeItem) => this.projectController.buildProject(treeItem)
		};

		const publishAction: dataworkspace.IProjectAction = {
			id: constants.publishAction,
			icon: IconPathHelper.publish,
			run: (treeItem: dataworkspace.WorkspaceTreeItem) => this.projectController.publishProject(treeItem)
		};

		const changeTargetPlatformAction: dataworkspace.IProjectAction = {
			id: constants.changeTargetPlatformAction,
			icon: IconPathHelper.targetPlatform,
			run: (treeItem: dataworkspace.WorkspaceTreeItem) => this.projectController.changeTargetPlatform(treeItem)
		};

		let group: dataworkspace.IProjectActionGroup = { actions: [addItemAction, schemaCompareAction, buildAction, publishAction] };

		return [group, changeTargetPlatformAction];
	}

	/** Adds the list of files and directories to the project, and saves the project file
	* @param projectFile The Uri of the project file
	* @param list list of uris of files and folders to add. Files and folders must already exist. Files and folders must already exist. No files or folders will be added if any do not exist.
	*/
	async addToProject(projectFile: vscode.Uri, list: vscode.Uri[]): Promise<void> {
		const project = await Project.openProject(projectFile.fsPath);
		await project.addToProject(list);
	}

	/**
	 * Gets the project information
	 */
	get projectInfo(): dataworkspace.IProjectInfo[] {
		const deployInfo: dataworkspace.IProjectInfo = {
			tableName: constants.Deployments,
			columnInfo: [{ displayName: constants.ID, width: 75, valueType: azdata.DeclarativeDataType.string },
			{ displayName: constants.Status, width: 180, valueType: azdata.DeclarativeDataType.component },
			{ displayName: constants.Target, width: 180, valueType: azdata.DeclarativeDataType.string },
			{ displayName: constants.Time, width: 180, valueType: azdata.DeclarativeDataType.string },
			{ displayName: constants.Date, width: 180, valueType: azdata.DeclarativeDataType.string }],
			columnData: this.projectController.DeployInfo
		};

		const buildInfo: dataworkspace.IProjectInfo = {
			tableName: constants.Builds,
			columnInfo: [{ displayName: constants.ID, width: 75, valueType: azdata.DeclarativeDataType.string },
			{ displayName: constants.Status, width: 180, valueType: azdata.DeclarativeDataType.component },
			{ displayName: constants.Target, width: 180, valueType: azdata.DeclarativeDataType.string },
			{ displayName: constants.Time, width: 180, valueType: azdata.DeclarativeDataType.string },
			{ displayName: constants.Date, width: 180, valueType: azdata.DeclarativeDataType.string }],
			columnData: this.projectController.BuildInfo
		};

		return [deployInfo, buildInfo];
	}
}
