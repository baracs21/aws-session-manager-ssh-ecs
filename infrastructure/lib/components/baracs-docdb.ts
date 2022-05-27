import {InstanceClass, InstanceSize, InstanceType, SubnetType} from "aws-cdk-lib/aws-ec2";
import {Construct} from "constructs";
import {DatabaseCluster} from "aws-cdk-lib/aws-docdb";
import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {RemovalPolicy} from "aws-cdk-lib";
import {BaracsVpc} from "./baracs-vpc";
import {FargateService} from "aws-cdk-lib/aws-ecs";

interface BaracsDocDbProps {
  vpc: BaracsVpc
  service: FargateService
}

export class BaracsDocDb extends DatabaseCluster {

  constructor(scope: Construct, id: string, props: BaracsDocDbProps) {
    super(scope, id, {
      vpc: props.vpc,
      dbClusterName: 'baracs-docdb-cluster',
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM),
      masterUser: {
        username: 'baracs',
        secretName: 'baracs-docdb'
      },
      cloudWatchLogsRetention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
      instances: 1
    })
    this.connections.allowDefaultPortFrom(props.service)
  }
}