import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';

// 1. Importa el nuevo constructor
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { HttpApi, CorsHttpMethod, HttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 2. Usa NodejsFunction en lugar de lambda.Function
    const apiFunction = new NodejsFunction(this, 'ApiLambda', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler', // El handler ahora es solo 'handler'
      entry: path.join(__dirname, '../src/lambda.ts'), // La ruta a tu archivo de entrada
      timeout: Duration.seconds(15),
      bundling: {
        externalModules: ['aws-sdk'], // Módulos a excluir del empaquetado
        nodeModules: ['date-fns-tz', '@codegenie/serverless-express'], // Forzar la inclusión de ambos módulos
      },
    });

    // El resto del código permanece igual
    const httpApi = new HttpApi(this, 'HttpApi', {
      corsPreflight: {
        allowHeaders: ['Content-Type'],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.OPTIONS],
        allowOrigins: ['*'],
      },
    });

    const integration = new HttpLambdaIntegration('LambdaIntegration', apiFunction);

    httpApi.addRoutes({
      path: '/calculate',
      methods: [HttpMethod.GET],
      integration: integration,
    });

    new CfnOutput(this, 'ApiUrl', {
      value: httpApi.url!,
    });
  }
}