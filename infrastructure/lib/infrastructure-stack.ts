import {Duration, RemovalPolicy, Stack, StackProps, Tags} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {
  GatewayVpcEndpointAwsService,
  InstanceClass,
  InstanceSize,
  InstanceType,
  InterfaceVpcEndpointAwsService,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc
} from "aws-cdk-lib/aws-ec2";
import {Cluster, ContainerImage, FargateService, FargateTaskDefinition, LogDriver} from "aws-cdk-lib/aws-ecs";
import {DockerImageAsset} from "aws-cdk-lib/aws-ecr-assets";
import * as path from "path";
import {CfnServiceLinkedRole, Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {LogGroup, RetentionDays} from "aws-cdk-lib/aws-logs";
import {DatabaseCluster} from "aws-cdk-lib/aws-docdb";


export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'vpc', {
      maxAzs: 2,
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
    //
    // const vpceSg = new SecurityGroup(this, 'vpce-sg', {
    //   vpc: vpc,
    //   allowAllOutbound: true
    // })
    //
    // const ssmVpcEndpoint = vpc.addInterfaceEndpoint('ssmvpce', {
    //   service: InterfaceVpcEndpointAwsService.SSM,
    //   subnets: {
    //     subnetType: SubnetType.PRIVATE_ISOLATED,
    //   },
    //   securityGroups: [
    //     vpceSg
    //   ]
    // })
    //
    // const s3VpcEndpoint = vpc.addGatewayEndpoint('s3vpce', {
    //   service: GatewayVpcEndpointAwsService.S3,
    //   subnets: [
    //     {
    //       subnetType: SubnetType.PRIVATE_ISOLATED
    //     }
    //   ]
    // })
    //
    // const ecrVpcEndpoint = vpc.addInterfaceEndpoint('ecrvpce', {
    //   service: InterfaceVpcEndpointAwsService.ECR,
    //   subnets: {
    //     subnetType: SubnetType.PRIVATE_ISOLATED
    //   },
    //   securityGroups: [
    //     vpceSg
    //   ]
    // })
    //
    // const dkrVpcEndpoint = vpc.addInterfaceEndpoint('dkr', {
    //   service: InterfaceVpcEndpointAwsService.ECR_DOCKER,
    //   subnets: {
    //     subnetType: SubnetType.PRIVATE_ISOLATED
    //   },
    //   securityGroups: [
    //     vpceSg
    //   ]
    // })
    //
    // const ssmMessageVpcEndpoint = vpc.addInterfaceEndpoint('ssmmessages', {
    //   service: InterfaceVpcEndpointAwsService.SSM_MESSAGES,
    //   subnets: {
    //     subnetType: SubnetType.PRIVATE_ISOLATED,
    //   },
    //   securityGroups: [
    //     vpceSg
    //   ]
    // })
    //
    // const cwlVpcEndpoints = vpc.addInterfaceEndpoint('cwl', {
    //   service: InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    //   subnets: {
    //     subnetType: SubnetType.PRIVATE_ISOLATED,
    //   },
    //   securityGroups: [
    //     vpceSg
    //   ]
    // })
    //
    // new CfnServiceLinkedRole(this, 'ecs-service-linked-role', {
    //   awsServiceName: 'ecs.amazonaws.com'
    // })
    //
    // const cluster = new Cluster(this, 'cluster', {
    //   vpc: vpc,
    //   containerInsights: false,
    //   clusterName: 'baracs-cluster'
    // })
    //
    // const taskDefinition = new FargateTaskDefinition(this, 'tunnel-task', {
    //   cpu: 256,
    //   memoryLimitMiB: 512
    // })
    //
    // taskDefinition.addToTaskRolePolicy(new PolicyStatement({
    //   effect: Effect.ALLOW,
    //   actions: [
    //     'ssm:PutParameter'
    //   ],
    //   resources: [
    //     `arn:aws:ssm:${props?.env?.region}:${props?.env?.account}:parameter/*`
    //   ]
    // }))
    //
    // taskDefinition.addContainer('container', {
    //   containerName: 'ssh-tunnel',
    //   image: ContainerImage.fromDockerImageAsset(new DockerImageAsset(this, 'tunnel-image', {
    //     directory: path.join(__dirname, '..', '..', 'src'),
    //     buildArgs: {
    //       "GO_WORKDIR": "server"
    //     }
    //   })),
    //   healthCheck: {
    //     command: [
    //       'curl localhost:8080/status'
    //     ],
    //     retries: 3,
    //     interval: Duration.seconds(10),
    //   },
    //   logging: LogDriver.awsLogs({
    //     streamPrefix: "ecs",
    //     logGroup: new LogGroup(this, 'ecs-log-group', {
    //       logGroupName: 'ssh-tunnel-lg',
    //       removalPolicy: RemovalPolicy.DESTROY,
    //       retention: RetentionDays.ONE_DAY
    //     })
    //   })
    // })
    //
    // const sg = new SecurityGroup(this, 'tunnel-sg', {
    //   vpc: vpc,
    //   allowAllOutbound: false
    // })
    //
    // sg.addEgressRule(vpceSg, Port.tcp(443), 'allow communication with vpcendpoints')
    // sg.addEgressRule(Peer.prefixList('pl-6da54004'), Port.tcp(443), 'allow communication with s3 over prefix list')
    //
    // const tunnel = new FargateService(this, 'tunnel-fargate-service', {
    //   serviceName: 'baracs-tunnel',
    //   cluster: cluster,
    //   taskDefinition: taskDefinition,
    //   securityGroups: [
    //     sg
    //   ],
    //   desiredCount: 1,
    //   enableExecuteCommand: true,
    //   vpcSubnets: {
    //     subnetType: SubnetType.PRIVATE_ISOLATED
    //   },
    // })
    // tunnel.node.addDependency(ecrVpcEndpoint, s3VpcEndpoint, dkrVpcEndpoint, cwlVpcEndpoints, ssmMessageVpcEndpoint, ssmVpcEndpoint)

    const dbCluster = new DatabaseCluster(this, 'baracs-docdb', {
      vpc: vpc,
      dbClusterName: 'baracs-db-cluster',
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM),
      masterUser: {
        username: 'baracs'
      },
      cloudWatchLogsRetention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
      instances: 1
    })

    // dbCluster.connections.allowDefaultPortFrom(tunnel)

    Tags.of(this).add('context', 'baracs');
  }

}
