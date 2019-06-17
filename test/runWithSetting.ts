/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { extensionPrefix, getGlobalSetting, updateGlobalSetting } from "../extension.bundle";

export async function runWithApimSetting(key: string, value: string | undefined, callback: () => Promise<void>): Promise<void> {
    await runWithSettingInternal(key, value, extensionPrefix, callback);
}

export async function runWithSetting(key: string, value: string | undefined, callback: () => Promise<void>): Promise<void> {
    await runWithSettingInternal(key, value, '', callback);
}

async function runWithSettingInternal(key: string, value: string | undefined, prefix: string, callback: () => Promise<void>): Promise<void> {
    const oldValue: string | undefined = getGlobalSetting(key, prefix);
    try {
        await updateGlobalSetting(key, value, prefix);
        await callback();
    } finally {
        await updateGlobalSetting(key, oldValue, prefix);
    }
}
