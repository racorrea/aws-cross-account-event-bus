import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';

export class SenderEventStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const SENDER_ACCOUNT_ID = "123456789012";
    const RECEIVER_EVENT_BUS_NAME = "receiver-bus"
    const RECEIVER_EVENT_BUS_ARN = `arn:aws:events:us-east-1:${SENDER_ACCOUNT_ID}:event-bus/${RECEIVER_EVENT_BUS_NAME}`;

    const SENDER_FUNCTION = new lambda.Function(this, 'sender-function', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const eventBridge = new AWS.EventBridge();
        
        exports.handler = async () => {
          const params = {
            Entries: [
              {
                Source: 'sent.event',
                EventBusName: 'sender-bus',
                DetailType: 'MyEvent',
                Detail: JSON.stringify({ message: 'Hello, World!' }),
              },
            ],
          };
          
          await eventBridge.putEvents(params).promise();
          console.log('Event: ', params);
          return 'Event sent';
        };
      `),
    });

    const SENDER_FUNCTION_LOGGROUP = new LogGroup(this, 'sender-function-loggroup', {
      logGroupName: '/aws/lambda/sender-function',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const SENDER_BUS = new events.EventBus(this, 'sender-bus', {
      eventBusName: 'sender-bus',
    });

    const SENDER_DISPATCH_RULE = new events.Rule(this, 'sender-dispatch-function-rule', {
      eventBus: SENDER_BUS,
      eventPattern: {
        source: ['sent.event'],
      },
      ruleName: 'sender-dispatch-function-rule'
    });

    SENDER_DISPATCH_RULE.addTarget(new targets.EventBus(
      events.EventBus.fromEventBusArn(this, 'receiver-bus', RECEIVER_EVENT_BUS_ARN),
    ));

    SENDER_FUNCTION_LOGGROUP.grantWrite(SENDER_FUNCTION);
    SENDER_BUS.grantPutEventsTo(SENDER_FUNCTION);

  }

}