import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from 'constructs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';

export class ReceiverStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const SENDER_ACCOUNT_ID = "123456789012";

    const RECEIVER_BUS = new events.EventBus(this, 'receiver-bus', {
      eventBusName: 'receiver-bus',
    });

    RECEIVER_BUS.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowAccountToPutEvents',
        effect: iam.Effect.ALLOW,
        actions: ['events:PutEvents'],
        resources: [RECEIVER_BUS.eventBusArn],
        principals: [new iam.AccountPrincipal(SENDER_ACCOUNT_ID)],
      })
    );

    const RECEIVER_DISPATCH_RULE = new events.Rule(this, 'receiver-dispatch-function-rule', {
      eventBus: RECEIVER_BUS,
      eventPattern: {
        source: ['sent.event'],
      },
    });

    const RECEIVER_FUNCTION = new lambda.Function(this, 'receiver-function', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
         exports.handler = async (event) => {
           console.log('Received event:', JSON.stringify(event, null, 2));
           return 'Event processed';
         };
       `),
    });

    const RECEIVER_FUNCTION_LOGGROUP = new LogGroup(this, 'receiver-function-loggroup', {
      logGroupName: '/aws/lambda/receiver-function',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY
    });

    RECEIVER_DISPATCH_RULE.addTarget(new targets.LambdaFunction(RECEIVER_FUNCTION, {
      retryAttempts: 2,
    }))
    
    RECEIVER_FUNCTION_LOGGROUP.grantWrite(RECEIVER_FUNCTION);
  }
}

/**
     * {
        "Version": "2012-10-17",
        "Statement": [{
          "Sid": "AllowAccountToPutEvents",
          "Effect": "Allow",
          "Principal": {
            "AWS": "arn:aws:iam::453027466500:root"
          },
          "Action": "events:PutEvents",
          "Resource": "arn:aws:events:us-east-1:537437622630:event-bus/destino"
        }]
      }
     */