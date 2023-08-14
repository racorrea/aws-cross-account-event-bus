#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ReceiverStack } from '../lib/receiver-event-stack';

const app = new cdk.App();
new ReceiverStack(app, 'ReceiverStack');