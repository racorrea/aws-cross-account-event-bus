#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SenderEventStack } from '../lib/sender-event-stack';

const app = new cdk.App();
new SenderEventStack(app, 'SenderEventStack');