import {Duration, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {
  GatewayVpcEndpointAwsService,
  InterfaceVpcEndpointAwsService,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc
} from "aws-cdk-lib/aws-ec2";
import {Cluster, ContainerImage, FargateService, FargateTaskDefinition} from "aws-cdk-lib/aws-ecs";
import {DockerImageAsset} from "aws-cdk-lib/aws-ecr-assets";
import * as path from "path";
import {CfnServiceLinkedRole, Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";


export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'vpc', {
      maxAzs: 1,
      cidr: '10.10.42.0/24',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          subnetType: SubnetType.PRIVATE_ISOLATED,
          name: 'private subnet'
        }
      ]
    })

    const vpceSg = new SecurityGroup(this, 'vpce-sg', {
      vpc: vpc,
      allowAllOutbound: true
    })
    vpceSg.addIngressRule(Peer.anyIpv4(), Port.tcp(443), 'allow all inbound from 443')

    vpc.addInterfaceEndpoint('ssmvpce', {
      service: InterfaceVpcEndpointAwsService.SSM,
      subnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [
        vpceSg
      ]
    })
    vpc.addGatewayEndpoint('s3vpce', {
      service: GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnetType: SubnetType.PRIVATE_ISOLATED
        }
      ]
    })
    vpc.addInterfaceEndpoint('ecrvpce', {
      service: InterfaceVpcEndpointAwsService.ECR,
      subnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [
        vpceSg
      ]
    })
    vpc.addInterfaceEndpoint('dkr', {
      service: InterfaceVpcEndpointAwsService.ECR_DOCKER,
      subnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [
        vpceSg
      ]
    })
    vpc.addInterfaceEndpoint('ssmmessages', {
      service: InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      subnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [
        vpceSg
      ]
    })

    new CfnServiceLinkedRole(this, 'ecs-service-linked-role', {
      awsServiceName: 'ecs.amazonaws.com'
    })

    const cluster = new Cluster(this, 'cluster', {
      vpc: vpc,
      containerInsights: false
    })

    const taskDefinition = new FargateTaskDefinition(this, 'tunnel-task', {
      cpu: 256,
      memoryLimitMiB: 512
    })

    taskDefinition.addToTaskRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'ssm:PutParameter'
      ],
      resources: [
        `arn:aws:ssm:${props?.env?.region}:${props?.env?.account}:parameter/*`
      ]
    }))

    taskDefinition.addContainer('container', {
      containerName: 'ssh-tunnel',
      image: ContainerImage.fromDockerImageAsset(new DockerImageAsset(this, 'tunnel-image', {
        directory: path.join(__dirname, '..', '..', 'src'),
        buildArgs: {
          "GO_WORKDIR": "server"
        }
      })),
      healthCheck: {
        command: [
          'curl localhost:8080/status'
        ],
        retries: 3,
        interval: Duration.seconds(10),
      }
    })

    const sg = new SecurityGroup(this, 'tunnel-sg', {
      vpc: vpc,
      allowAllOutbound: false
    })
    sg.addEgressRule(vpceSg, Port.tcp(443), 'allow communication with vpcendpoints')

    new FargateService(this, 'tunnel-fargate-service', {
      serviceName: 'tunnel',
      cluster: cluster,
      taskDefinition: taskDefinition,
      securityGroups: [
        sg
      ],
      desiredCount: 1,
      enableExecuteCommand: true,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
    })

  }
}
