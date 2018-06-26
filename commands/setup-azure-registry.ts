import vscode = require('vscode');
import { ImageItem, quickPickImage } from './utils/quick-pick-image';
import { reporter } from '../telemetry/telemetry';
import { ImageNode } from '../explorer/models/imageNode';
import { ExecuteCommandRequest } from 'vscode-languageclient/lib/main';
import { exec } from 'child_process';
const teleCmdId: string = 'vscode-docker.image.push';
const teleAzureId: string = 'vscode-docker.image.push.azureContainerRegistry';