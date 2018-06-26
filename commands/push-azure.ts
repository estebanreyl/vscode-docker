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
const {promisify} = require("es6-promisify");

//FOR TELEMETRY DATA
const teleCmdId: string = 'vscode-docker.image.pushToAzure';
const teleAzureId: string = 'vscode-docker.image.push.azureContainerRegistry';
const exec = promisify(require('child_process').exec);

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
        let cont = function(err, stdout, stderr){
            console.log(stdout); 
            let jsonStdout =  JSON.parse(stdout);
            let soughtsrvr : string = "";
            for(let i = 0; i < jsonStdout.length; i++){
                let srvrName : string = jsonStdout[i]['acrLoginServer'];
                let searchIndex : number = srvrName.search(`${regName}`);
                if(searchIndex== 0 && srvrName[regName.length] === '.'){ // can names include . ?
                    soughtsrvr = srvrName;
                    break;
                }
            }
            
            if(soughtsrvr === ''){
                vscode.window.showErrorMessage(`${regName} could not be found in resource group: ${resGroup}`);
                return;
            }
    
            // 5. Acquire Version
            options = {
                prompt: "Image Version?"
            }
            vscode.window.showInputBox(options).then(version => {
                // 6. Push image
                terminal.sendText(`docker tag microsoft/${imageName} ${soughtsrvr}/${imageName}:${version}`);
                terminal.sendText(`docker push ${soughtsrvr}/${imageName}:${version}`);
                terminal.sendText(`docker push ${imageName}`);
                terminal.show();
            });
        }



        exec(`az acr list --resource-group ${resGroup} --query "[].{acrLoginServer:loginServer}" --output json`, cont);
        
        //const strStdout:string  = await streamToString(stdout);
    }
}

function streamToString (stream) {
    const chunks = []
    return new Promise<string>((resolve, reject) => {
      stream.on('data', chunks.push)
      stream.on('error', reject)
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
  }