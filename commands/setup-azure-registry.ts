import vscode = require('vscode');
import { ImageItem, quickPickImage } from './utils/quick-pick-image';
import { reporter } from '../telemetry/telemetry';
import { ImageNode } from '../explorer/models/imageNode';
import { ExecuteCommandRequest } from 'vscode-languageclient/lib/main';
import { exec } from 'child_process';
const teleCmdId: string = 'vscode-docker.image.push';
const teleAzureId: string = 'vscode-docker.image.push.azureContainerRegistry';

export async function pushImage(context?: ImageNode) {
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
        //BACKUP
        //Container setup
        
        terminal.sendText(`az group create--name ${resGroup}--location ${location}`);
        terminal.sendText(`az acr create --resource-group ${resGroup} --name ${regName} --sku ${sku}`);
        
        //
        terminal.sendText(`az acr login --name ${regName}`);
        let stdout = await sh(`az acr list --resource-group ${resGroup} --query "[].{acrLoginServer:loginServer}" --output table`); // NEED TO TEST MAY NOT WORK
        terminal.sendText(`docker tag microsoft/${imgName} ${stdout}/${imgName}:${version}`);
        terminal.sendText(`docker push ${stdout}/${imgName}:${version}`);


//OLD
        terminal.sendText(`docker push ${imageName}`);

        terminal.show();
        if (reporter) {
            /* __GDPR__
               "command" : {
                  "command" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
               }
             */
            reporter.sendTelemetryEvent('command', {
                command: teleCmdId
            });

            if (imageName.toLowerCase().indexOf('azurecr.io')) {
                /* __GDPR__
                   "command" : {
                      "command" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                   }
                 */
                reporter.sendTelemetryEvent('command', {
                    command: teleAzureId
                });

            }
        }
    };
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


/*
terminal.sendText(`docker push ${imageName}`);
terminal.show();
if (reporter) {
    /* __GDPR__
       "command" : {
          "command" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
       }
     
    reporter.sendTelemetryEvent('command', {
        command: teleCmdId
    });

    if (imageName.toLowerCase().indexOf('azurecr.io')) {
        /* __GDPR__
           "command" : {
              "command" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
           }
         
        reporter.sendTelemetryEvent('command', {
            command: teleAzureId
        });

    }
}
    };*/