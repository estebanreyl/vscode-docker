/* push-azure.ts
 * 
 * Very basic integration for pushing to azure container registry instead of Docker hub
 * Author : Esteban Rey
 * Version 0.01
 * Updated 6/25/2018
 * 
 * Known Issues:
 * Does not currently identify if resource groups/container registry exist.
 * Is currently dependent on terminal installation of azure CLI
 * Await not waiting properly/use promises
 */


import vscode = require('vscode');
import { ImageItem, quickPickImage } from './utils/quick-pick-image';
import { reporter } from '../telemetry/telemetry';
import { ImageNode } from '../explorer/models/imageNode';
import { ExecuteCommandRequest } from 'vscode-languageclient/lib/main';
import { exec } from 'child_process';

//FOR TELEMETRY DATA
const teleCmdId: string = 'vscode-docker.image.pushToAzure';
const teleAzureId: string = 'vscode-docker.image.push.azureContainerRegistry';

export async function pushAzure(context?: ImageNode) {
    let imageToPush: Docker.ImageDesc;
    let imageName: string = "";

    if (context && context.imageDesc) {
        imageToPush = context.imageDesc;
        imageName = context.label;
    } else {
        const selectedItem: ImageItem = await quickPickImage();
        if (selectedItem) {
            imageToPush = selectedItem.imageDesc;
            imageName = selectedItem.label;
        }
    }

    if (imageToPush) {
        const terminal = vscode.window.createTerminal(imageName);

        //  1. Registry Name
        let options: vscode.InputBoxOptions = {
            prompt: "Azure Container Registry Name?"
        }


        let regName = await vscode.window.showInputBox(options);

        terminal.sendText(`az acr login --name ${regName}`);

        //  2. Resource Group Name
        options = {
            prompt: "Resource Group Name?"
        }
        let resGroup = await vscode.window.showInputBox(options);

        // 3. Check for the existance of the resource group, if doesnt exist, create -- maybe close enough feature?

        // 4. Acquire full acrLogin (Needs Testing)
        let stdout = await sh(`az acr list --resource-group ${resGroup} --query "[].{acrLoginServer:loginServer}" --output table`);

        // 5. Acquire Version
        options = {
            prompt: "Image Version?"
        }
        let version = await vscode.window.showInputBox(options);

        // 6. Push image
        terminal.sendText(`docker tag microsoft/${imageName} ${stdout}/${imageName}:${version}`);
        terminal.sendText(`docker push ${stdout}/${imageName}:${version}`);
        terminal.sendText(`docker push ${imageName}`);
        terminal.show();
    }
}

async function sh(cmd) {
    return new Promise(function (resolve, reject) {
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}
