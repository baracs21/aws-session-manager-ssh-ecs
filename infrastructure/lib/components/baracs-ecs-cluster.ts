import {Construct} from "constructs";
import {BaracsVpc} from "./baracs-vpc";
import {CfnServiceLinkedRole, Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {Cluster, ContainerImage, FargateService, FargateTaskDefinition, LogDriver} from "aws-cdk-lib/aws-ecs";
import {Environment} from "aws-cdk-lib/core/lib/environment";
import {DockerImageAsset} from "aws-cdk-lib/aws-ecr-assets";
import * as path from "path";
import {Duration, RemovalPolicy} from "aws-cdk-lib";
import {LogGroup, RetentionDays} from "aws-cdk-lib/aws-logs";
import {Peer, Port, SecurityGroup, SubnetType} from "aws-cdk-lib/aws-ec2";

interface BaracsEcsClusterProps {
  vpc: BaracsVpc
  env: Environment
}

export class BaracsEcsCluster {

  tunnelService: FargateService

  constructor(scope: Construct, props: BaracsEcsClusterProps) {

    new CfnServiceLinkedRole(scope, 'ecs-service-linked-role', {
      awsServiceName: 'ecs.amazonaws.com'
    })

    const cluster = new Cluster(scope, 'cluster', {
      vpc: props.vpc,
      containerInsights: false,
      clusterName: 'baracs-cluster'
    })

    const taskDefinition = new FargateTaskDefinition(scope, 'tunnel-task', {
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
      image: ContainerImage.fromDockerImageAsset(new DockerImageAsset(scope, 'tunnel-image', {
        directory: path.join(__dirname, '..', '..', '..', 'src'),
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
      },
      logging: LogDriver.awsLogs({
        streamPrefix: "ecs",
        logGroup: new LogGroup(scope, 'ecs-log-group', {
          logGroupName: 'ssh-tunnel-lg',
          removalPolicy: RemovalPolicy.DESTROY,
          retention: RetentionDays.ONE_DAY
        })
      })
    })

    const sg = new SecurityGroup(this, 'tunnel-sg', {
      vpc: props.vpc,
      allowAllOutbound: false
    })

    sg.addEgressRule(props.vpc.vpcEndpointSg, Port.tcp(443), 'allow communication with vpcendpoints')
    sg.addEgressRule(Peer.prefixList('pl-6da54004'), Port.tcp(443), 'allow communication with s3 over prefix list')

    this.tunnelService = new FargateService(scope, 'tunnel-fargate-service', {
      serviceName: 'baracs-tunnel',
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
    this.tunnelService.node.addDependency(props.vpc.ecrVpcEndpoint, props.vpc.s3VpcEndpoint, props.vpc.dkrVpcEndpoint, props.vpc.cwlVpcEndpoints, props.vpc.ssmMessageVpcEndpoint, props.vpc.ssmVpcEndpoint)
  }

}