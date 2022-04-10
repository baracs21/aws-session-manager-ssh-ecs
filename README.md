# CDK - ECS-SessionManager-SSH-Example

## Use Case

Sometimes it is needed to access an ecs fargate task for debugging purpose, or you have the need to access private aws resources (i.e. document db in private subnet). This example make it possible to access an ecs task or to establish an ssh tunnel to access private aws resources from your local machine.


## Checkout

Please use `git clone --recursive -j8 git@github.com:baracs21/aws-examples.git`, because this repository uses git submodules.

## References

- https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html

## Notes

ECS Targes: ecs:ClusterName_task_runtimeId
