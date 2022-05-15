import {Stack, StackProps, Tags} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {BaracsVpc} from "./components/baracs-vpc";
import {BaracsEcsCluster} from "./components/baracs-ecs-cluster";
import {BaracsDocDb} from "./components/baracs-docdb";


export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new BaracsVpc(this, 'baracs-vpc');

    const ecsCluster = new BaracsEcsCluster(this, {
      vpc: vpc,
      env: props?.env!
    })

    new BaracsDocDb(this, 'baracs-docdb', {
      service: ecsCluster.tunnelService,
      vpc: vpc
    })

    Tags.of(this).add('context', 'baracs');
  }

}
