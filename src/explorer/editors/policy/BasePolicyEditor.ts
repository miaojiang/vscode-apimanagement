/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ApiManagementModels } from "azure-arm-apimanagement";
import { window } from "vscode";
import { AzureTreeItem, IParsedError, parseError } from "vscode-azureextensionui";
import { policyFormat, showSavePromptConfigKey } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../localize";
import { errorUtil, processError } from "../../../utils/errorUtil";
import { nameUtil } from "../../../utils/nameUtil";
import { IServiceTreeRoot } from "../../IServiceTreeRoot";
import { Editor } from "../Editor";

export abstract class BasePolicyEditor<TRoot extends IServiceTreeRoot> extends Editor<AzureTreeItem<TRoot>> {
    constructor() {
        super(showSavePromptConfigKey);
    }

    public abstract getDefaultPolicy() : string;
    public abstract getPolicy(context: AzureTreeItem<TRoot>): Promise<string>;
    public abstract updatePolicy(context: AzureTreeItem<TRoot>, policy: ApiManagementModels.PolicyContract): Promise<string>;

    public async getData(context: AzureTreeItem<TRoot>): Promise<string> {
        try {
            return await this.getPolicy(context);
        } catch (error) {
// tslint:disable-next-line: no-unsafe-any
            ext.outputChannel.appendLine(error);
            const err: IParsedError = parseError(error);
            if (err.errorType.toLocaleLowerCase() === 'notfound' || err.errorType.toLowerCase() === 'resourcenotfound') {
                return this.getDefaultPolicy();
            } else {
                let errorMessage = err.message;
                if (err.errorType.toLowerCase() === 'validationerror') {
                    // tslint:disable-next-line: no-unsafe-any
                    errorMessage = errorUtil(error.response.body);
                }
                ext.outputChannel.appendLine(errorMessage);
                ext.outputChannel.show();
                throw new Error(errorMessage);
            }
        }
    }

    public async getFilename(context: AzureTreeItem<TRoot>): Promise<string> {
        return `${nameUtil(context.root)}.policy.cshtml`;
    }

    public async updateData(context: AzureTreeItem<TRoot>, data: string): Promise<string> {
        try {
            await this.updatePolicy(context, <ApiManagementModels.PolicyContract>{ format: policyFormat, value: data});
            window.showInformationMessage(localize("updatePolicySucceded", `Changes to policy were uploaded to cloud.`));
            return await this.getPolicy(context);
        } catch (error) {
            throw new Error(processError(error, localize("updatePolicyFailed", `Changes to policy were not uploaded to cloud.`)));
        }
    }

    public async getSize(): Promise<number> {
        throw new Error("Method not implemented.");
    }
    public async getSaveConfirmationText(): Promise<string> {
        return localize("saveConfirmation", "Do you want to upload changes to cloud?");
    }
}
