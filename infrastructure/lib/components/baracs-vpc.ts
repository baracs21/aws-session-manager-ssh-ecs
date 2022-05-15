import {
  GatewayVpcEndpoint,
  GatewayVpcEndpointAwsService,
  InterfaceVpcEndpoint,
  InterfaceVpcEndpointAwsService,
  ISecurityGroup,
  SecurityGroup,
  SubnetType,
  Vpc
} from "aws-cdk-lib/aws-ec2";
import {Construct} from "constructs";

export class BaracsVpc extends Vpc {
  vpcEndpointSg: ISecurityGroup

  ssmVpcEndpoint: InterfaceVpcEndpoint
  ecrVpcEndpoint: InterfaceVpcEndpoint
  dkrVpcEndpoint: InterfaceVpcEndpoint
  ssmMessageVpcEndpoint: InterfaceVpcEndpoint
  cwlVpcEndpoints: InterfaceVpcEndpoint

  s3VpcEndpoint: GatewayVpcEndpoint

  constructor(scope: Construct, id: string) {
    super(scope, id, {
      maxAzs: 2,
      cidr: '10.10.42.0/24',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          subnetType: SubnetType.PRIVATE_ISOLATED,
          name: 'baracs private subnet'
        }
      ]
    });

    this.vpcEndpointSg = new SecurityGroup(this, 'vpce-sg', {
      vpc: this,
      allowAllOutbound: true
    })

    this.ssmVpcEndpoint = this.addInterfaceEndpoint('ssmvpce', {
      service: InterfaceVpcEndpointAwsService.SSM,
      subnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [
        this.vpcEndpointSg
      ]
    })

    this.s3VpcEndpoint = this.addGatewayEndpoint('s3vpce', {
      service: GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnetType: SubnetType.PRIVATE_ISOLATED
        }
      ]
    })

    this.ecrVpcEndpoint = this.addInterfaceEndpoint('ecrvpce', {
      service: InterfaceVpcEndpointAwsService.ECR,
      subnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [
        this.vpcEndpointSg
      ]
    })

    this.dkrVpcEndpoint = this.addInterfaceEndpoint('dkr', {
      service: InterfaceVpcEndpointAwsService.ECR_DOCKER,
      subnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [
        this.vpcEndpointSg
      ]
    })

    this.ssmMessageVpcEndpoint = this.addInterfaceEndpoint('ssmmessages', {
      service: InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      subnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [
        this.vpcEndpointSg
      ]
    })

    this.cwlVpcEndpoints = this.addInterfaceEndpoint('cwl', {
      service: InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [
        this.vpcEndpointSg
      ]
    })
  }

}