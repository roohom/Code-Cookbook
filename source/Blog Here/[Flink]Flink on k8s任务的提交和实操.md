# [Flink]Flink on k8s任务的提交和实操

## 说明

下文操作基于的一些组件说明：

> Flink 版本1.18.1
>
> 容器工具：orbstack
>
> 操作系统：macOS 26.2
>
> 下文的操作建议和步骤引导大部分由Xiaomi MIMO大模型生成，对我零基础学习K8s提供了巨大帮助。
>
> 我爱小米，小米加油。

## 环境准备

创建 ServiceAccount（名称设置为 `flink`）

~~~shell
cat > flink-serviceaccount.yaml <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: flink
  namespace: default
EOF

kubectl apply -f flink-serviceaccount.yaml

~~~

创建 Role（授予必要权限）

~~~shell
cat > flink-role.yaml <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: flink-role
  namespace: default
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "events"]
  verbs: ["get", "list", "watch", "create", "delete", "update", "patch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "delete", "update", "patch"]
EOF

kubectl apply -f flink-role.yaml

~~~

创建 RoleBinding（绑定 `flink` ServiceAccount）

~~~shell
cat > flink-rolebinding.yaml <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: flink-rolebinding
  namespace: default
subjects:
- kind: ServiceAccount
  name: flink
  namespace: default
roleRef:
  kind: Role
  name: flink-role
  apiGroup: rbac.authorization.k8s.io
EOF

kubectl apply -f flink-rolebinding.yaml

~~~







## 创建session集群

提交Flink session on k8s

~~~shell
./bin/kubernetes-session.sh \
  -Dkubernetes.cluster-id=flink-k8s-cluster \
  -Dkubernetes.service-account=flink \
  -Dtaskmanager.memory.process.size=1024m \
  -Dkubernetes.taskmanager.cpu=1 \
  -Dtaskmanager.numberOfTaskSlots=2 \
  -Dkubernetes.container.image=flink:1.18.1

~~~



设置外部访问

~~~shell
# 查找 JobManager Service 名称
kubectl get services -l app=flink-k8s-cluster

# 端口转发（假设服务名是 flink-k8s-cluster-rest）
kubectl port-forward service/flink-k8s-cluster-rest 8089:8089

~~~

## 提交 Flink 任务到 Session 集群

### 提交任务

使用 Flink CLI 提交示例任务

~~~shell
./bin/flink run -d -t kubernetes-session \
  -Dkubernetes.cluster-id=flink-k8s-cluster \
  examples/streaming/WindowJoin.jar

~~~



### DNS解析问题

提交失败，遇到DNS解析问题

~~~log
➜  flink-1.18.1 ./bin/flink run -d -t kubernetes-session \
  -Dkubernetes.cluster-id=flink-k8s-cluster \
  examples/streaming/WindowJoin.jar

Using windowSize=2000, data rate=3
To customize example, use: WindowJoin [--windowSize <window-size-in-millis>] [--rate <elements-per-second>]
2026-01-17 02:00:48,980 WARN  org.apache.flink.kubernetes.KubernetesClusterDescriptor      [] - Please note that Flink client operations(e.g. cancel, list, stop, savepoint, etc.) won't work from outside the Kubernetes cluster since 'kubernetes.rest-service.exposed.type' has been set to ClusterIP.
2026-01-17 02:00:48,981 INFO  org.apache.flink.kubernetes.KubernetesClusterDescriptor      [] - Retrieve flink cluster flink-k8s-cluster successfully, JobManager Web Interface: http://flink-k8s-cluster-rest.default:8089
2026-01-17 02:00:49,006 WARN  org.apache.flink.kubernetes.KubernetesClusterDescriptor      [] - Please note that Flink client operations(e.g. cancel, list, stop, savepoint, etc.) won't work from outside the Kubernetes cluster since 'kubernetes.rest-service.exposed.type' has been set to ClusterIP.

------------------------------------------------------------
 The program finished with the following exception:

org.apache.flink.client.program.ProgramInvocationException: The main method caused an error: Failed to execute job 'Windowed Join Example'.
	at org.apache.flink.client.program.PackagedProgram.callMainMethod(PackagedProgram.java:372)
	at org.apache.flink.client.program.PackagedProgram.invokeInteractiveModeForExecution(PackagedProgram.java:222)
	at org.apache.flink.client.ClientUtils.executeProgram(ClientUtils.java:105)
	at org.apache.flink.client.cli.CliFrontend.executeProgram(CliFrontend.java:851)
	at org.apache.flink.client.cli.CliFrontend.run(CliFrontend.java:245)
	at org.apache.flink.client.cli.CliFrontend.parseAndRun(CliFrontend.java:1095)
	at org.apache.flink.client.cli.CliFrontend.lambda$mainInternal$9(CliFrontend.java:1189)
	at java.security.AccessController.doPrivileged(Native Method)
	at javax.security.auth.Subject.doAs(Subject.java:422)
	at org.apache.hadoop.security.UserGroupInformation.doAs(UserGroupInformation.java:1878)
	at org.apache.flink.runtime.security.contexts.HadoopSecurityContext.runSecured(HadoopSecurityContext.java:41)
	at org.apache.flink.client.cli.CliFrontend.mainInternal(CliFrontend.java:1189)
	at org.apache.flink.client.cli.CliFrontend.main(CliFrontend.java:1157)
Caused by: org.apache.flink.util.FlinkException: Failed to execute job 'Windowed Join Example'.
	at org.apache.flink.streaming.api.environment.StreamExecutionEnvironment.executeAsync(StreamExecutionEnvironment.java:2253)
	at org.apache.flink.client.program.StreamContextEnvironment.executeAsync(StreamContextEnvironment.java:189)
	at org.apache.flink.client.program.StreamContextEnvironment.execute(StreamContextEnvironment.java:118)
	at org.apache.flink.streaming.api.environment.StreamExecutionEnvironment.execute(StreamExecutionEnvironment.java:2099)
	at org.apache.flink.streaming.examples.join.WindowJoin.main(WindowJoin.java:110)
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
	at java.lang.reflect.Method.invoke(Method.java:498)
	at org.apache.flink.client.program.PackagedProgram.callMainMethod(PackagedProgram.java:355)
	... 12 more
Caused by: org.apache.flink.runtime.client.JobSubmissionException: Failed to submit JobGraph.
	at org.apache.flink.client.program.rest.RestClusterClient.lambda$submitJob$12(RestClusterClient.java:458)
	at java.util.concurrent.CompletableFuture.uniExceptionally(CompletableFuture.java:884)
	at java.util.concurrent.CompletableFuture$UniExceptionally.tryFire(CompletableFuture.java:866)
	at java.util.concurrent.CompletableFuture.postComplete(CompletableFuture.java:488)
	at java.util.concurrent.CompletableFuture.completeExceptionally(CompletableFuture.java:1990)
	at org.apache.flink.util.concurrent.FutureUtils.lambda$retryOperationWithDelay$6(FutureUtils.java:298)
	at java.util.concurrent.CompletableFuture.uniWhenComplete(CompletableFuture.java:774)
	at java.util.concurrent.CompletableFuture$UniWhenComplete.tryFire(CompletableFuture.java:750)
	at java.util.concurrent.CompletableFuture.postComplete(CompletableFuture.java:488)
	at java.util.concurrent.CompletableFuture.completeExceptionally(CompletableFuture.java:1990)
	at org.apache.flink.runtime.rest.RestClient.lambda$submitRequest$4(RestClient.java:590)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.DefaultPromise.notifyListener0(DefaultPromise.java:590)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.DefaultPromise.notifyListenersNow(DefaultPromise.java:557)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.DefaultPromise.notifyListeners(DefaultPromise.java:492)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.DefaultPromise.setValue0(DefaultPromise.java:636)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.DefaultPromise.setFailure0(DefaultPromise.java:629)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.DefaultPromise.setFailure(DefaultPromise.java:110)
	at org.apache.flink.shaded.netty4.io.netty.channel.DefaultChannelPromise.setFailure(DefaultChannelPromise.java:89)
	at org.apache.flink.shaded.netty4.io.netty.bootstrap.Bootstrap.doResolveAndConnect0(Bootstrap.java:214)
	at org.apache.flink.shaded.netty4.io.netty.bootstrap.Bootstrap.access$000(Bootstrap.java:46)
	at org.apache.flink.shaded.netty4.io.netty.bootstrap.Bootstrap$1.operationComplete(Bootstrap.java:180)
	at org.apache.flink.shaded.netty4.io.netty.bootstrap.Bootstrap$1.operationComplete(Bootstrap.java:166)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.DefaultPromise.notifyListener0(DefaultPromise.java:590)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.DefaultPromise.notifyListenersNow(DefaultPromise.java:557)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.DefaultPromise.notifyListeners(DefaultPromise.java:492)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.DefaultPromise.setValue0(DefaultPromise.java:636)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.DefaultPromise.setSuccess0(DefaultPromise.java:625)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.DefaultPromise.trySuccess(DefaultPromise.java:105)
	at org.apache.flink.shaded.netty4.io.netty.channel.DefaultChannelPromise.trySuccess(DefaultChannelPromise.java:84)
	at org.apache.flink.shaded.netty4.io.netty.channel.AbstractChannel$AbstractUnsafe.safeSetSuccess(AbstractChannel.java:990)
	at org.apache.flink.shaded.netty4.io.netty.channel.AbstractChannel$AbstractUnsafe.register0(AbstractChannel.java:516)
	at org.apache.flink.shaded.netty4.io.netty.channel.AbstractChannel$AbstractUnsafe.access$200(AbstractChannel.java:429)
	at org.apache.flink.shaded.netty4.io.netty.channel.AbstractChannel$AbstractUnsafe$1.run(AbstractChannel.java:486)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.AbstractEventExecutor.runTask(AbstractEventExecutor.java:174)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.AbstractEventExecutor.safeExecute(AbstractEventExecutor.java:167)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.SingleThreadEventExecutor.runAllTasks(SingleThreadEventExecutor.java:470)
	at org.apache.flink.shaded.netty4.io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:569)
	at org.apache.flink.shaded.netty4.io.netty.util.concurrent.SingleThreadEventExecutor$4.run(SingleThreadEventExecutor.java:997)
	at org.apache.flink.shaded.netty4.io.netty.util.internal.ThreadExecutorMap$2.run(ThreadExecutorMap.java:74)
	at java.lang.Thread.run(Thread.java:750)
Caused by: org.apache.flink.util.concurrent.FutureUtils$RetryException: Could not complete the operation. Number of retries has been exhausted.
	at org.apache.flink.util.concurrent.FutureUtils.lambda$retryOperationWithDelay$6(FutureUtils.java:294)
	... 34 more
Caused by: java.util.concurrent.CompletionException: java.net.UnknownHostException: flink-k8s-cluster-rest.default: nodename nor servname provided, or not known
	at java.util.concurrent.CompletableFuture.encodeThrowable(CompletableFuture.java:292)
	at java.util.concurrent.CompletableFuture.completeThrowable(CompletableFuture.java:308)
	at java.util.concurrent.CompletableFuture.uniCompose(CompletableFuture.java:957)
	at java.util.concurrent.CompletableFuture$UniCompose.tryFire(CompletableFuture.java:940)
	... 32 more
Caused by: java.net.UnknownHostException: flink-k8s-cluster-rest.default: nodename nor servname provided, or not known
	at java.net.Inet6AddressImpl.lookupAllHostAddr(Native Method)
	at java.net.InetAddress$2.lookupAllHostAddr(InetAddress.java:929)
	at java.net.InetAddress.getAddressesFromNameService(InetAddress.java:1343)
	at java.net.InetAddress.getAllByName0(InetAddress.java:1295)
	at java.net.InetAddress.getAllByName(InetAddress.java:1205)
	at java.net.InetAddress.getAllByName(InetAddress.java:1127)
	at java.net.InetAddress.getByName(InetAddress.java:1077)
	at org.apache.flink.shaded.netty4.io.netty.util.internal.SocketUtils$8.run(SocketUtils.java:156)
	at org.apache.flink.shaded.netty4.io.netty.util.internal.SocketUtils$8.run(SocketUtils.java:153)
	at java.security.AccessController.doPrivileged(Native Method)
	at org.apache.flink.shaded.netty4.io.netty.util.internal.SocketUtils.addressByName(SocketUtils.java:153)
	at org.apache.flink.shaded.netty4.io.netty.resolver.DefaultNameResolver.doResolve(DefaultNameResolver.java:41)
	at org.apache.flink.shaded.netty4.io.netty.resolver.SimpleNameResolver.resolve(SimpleNameResolver.java:61)
	at org.apache.flink.shaded.netty4.io.netty.resolver.SimpleNameResolver.resolve(SimpleNameResolver.java:53)
	at org.apache.flink.shaded.netty4.io.netty.resolver.InetSocketAddressResolver.doResolve(InetSocketAddressResolver.java:55)
	at org.apache.flink.shaded.netty4.io.netty.resolver.InetSocketAddressResolver.doResolve(InetSocketAddressResolver.java:31)
	at org.apache.flink.shaded.netty4.io.netty.resolver.AbstractAddressResolver.resolve(AbstractAddressResolver.java:106)
	at org.apache.flink.shaded.netty4.io.netty.bootstrap.Bootstrap.doResolveAndConnect0(Bootstrap.java:206)
	... 21 more
➜  flink-1.18.1
~~~

### 修复DNS问题

1. 获取 JobManager Pod 名称

~~~shell
➜  flink-1.18.1 kubectl get pods -l app=flink-k8s-cluster,component=jobmanager

NAME                                 READY   STATUS    RESTARTS   AGE
flink-k8s-cluster-7b8779cfcc-vf6dp   1/1     Running   0          11m
~~~

  2.  进入 Pod

~~~shell

kubectl exec -it flink-k8s-cluster-7b8779cfcc-vf6dp -- /bin/bash

~~~

3. 在容器内测试 DNS 解析

   ~~~shell
   ➜  flink-1.18.1 kubectl exec -it flink-k8s-cluster-7b8779cfcc-vf6dp -- /bin/bash
   
   root@flink-k8s-cluster-7b8779cfcc-vf6dp:/opt/flink# nslookup flink-k8s-cluster-rest.default
   bash: nslookup: command not found
   root@flink-k8s-cluster-7b8779cfcc-vf6dp:/opt/flink# nslookup kubernetes.default
   bash: nslookup: command not found
   root@flink-k8s-cluster-7b8779cfcc-vf6dp:/opt/flink# nslookup kube-dns.kube-system.svc.cluster.local
   bash: nslookup: command not found
   root@flink-k8s-cluster-7b8779cfcc-vf6dp:/opt/flink# kubectl get pods -n kube-system -l k8s-app=kube-dns
   bash: kubectl: command not found
   ~~~

4. 检查 CoreDNS 状态

   ~~~shell
   ➜  flink-1.18.1 kubectl get pods -n kube-system -l k8s-app=kube-dns
   
   NAME                       READY   STATUS    RESTARTS   AGE
   coredns-6cc96b5c97-wdbb9   1/1     Running   0          49m
   ➜  flink-1.18.1
   
   ~~~

5. 查看flink配置，发现JM绑定了localhost

   ~~~shell
   JM_POD=$(kubectl get pods -l app=flink-k8s-cluster,component=jobmanager -o jsonpath='{.items[0].metadata.name}')
   
   # 直接使用路径查看（假设路径为 /opt/flink/conf/flink-conf.yaml）
   kubectl exec -it $JM_POD -- cat /opt/flink/conf/flink-conf.yaml
   ~~~

6. 删除flink安装目录下的flink-conf.yaml中的`rest.address: localhost`和`rest.bind-address: localhost`

7. 清理旧资源，重新启动任务

   ~~~shell
   # 清理旧资源
   kubectl delete deployment,service,configmap --selector=app=flink-k8s-cluster
   
   # 2. 重新启动（关键：添加 -Drest.address 和 -Drest.port）
   ./bin/kubernetes-session.sh \
     -Dkubernetes.cluster-id=flink-k8s-cluster \
     -Dkubernetes.service-account=flink \
     -Drest.address=flink-k8s-cluster-rest.default \
     -Drest.port=8089 \
     -Dtaskmanager.memory.process.size=1024m \
     -Dkubernetes.taskmanager.cpu=1 \
     -Dtaskmanager.numberOfTaskSlots=2 \
     -Dkubernetes.container.image=flink:1.18.1
   
   # 提交任务测试
   ./bin/flink run -d -t kubernetes-session \
     -Dkubernetes.cluster-id=flink-k8s-cluster \
     examples/streaming/WindowJoin.jar
   
   ~~~

8. 再次确认flink的rest信息

   ~~~shell
   #获取POD信息
   ➜  flink-1.18.1 JM_POD=$(kubectl get pods -l app=flink-k8s-cluster,component=jobmanager -o jsonpath='{.items[0].metadata.name}')
   #查看rest的绑定地址
   ➜  flink-1.18.1 kubectl logs $JM_POD --tail=20 | grep -i "rest"
   
   2026-01-16 18:50:00,302 INFO  org.apache.flink.configuration.GlobalConfiguration           [] - Loading configuration property: rest.port, 8089
   2026-01-16 18:50:00,303 INFO  org.apache.flink.configuration.GlobalConfiguration           [] - Loading configuration property: rest.address, flink-k8s-cluster-rest.default
   ➜  flink-1.18.1
   ~~~

9. 如果还不成功，使用集群内客户端提交

   ~~~shell
   JM_POD=$(kubectl get pods -l app=flink-k8s-cluster,component=jobmanager -o jsonpath='{.items[0].metadata.name}')
   kubectl exec -it $JM_POD -- /opt/flink/bin/flink run -d /opt/flink/examples/streaming/WindowJoin.jar
   ~~~

10. 部署 kube-proxy

    ~~~shell
    # 下载 kube-proxy 二进制（与集群版本一致）
    wget https://dl.k8s.io/v1.28.4/bin/linux/amd64/kube-proxy
    chmod +x kube-proxy
    sudo mv kube-proxy /usr/local/bin/
    
    # 创建 kube-proxy ConfigMap（示例）
    kubectl apply -f - <<EOF
    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: kube-proxy
      namespace: kube-system
    data:
      config.conf: |
        apiVersion: kubeproxy.config.k8s.io/v1alpha1
        kind: KubeProxyConfiguration
        mode: "ipvs"
        clusterCIDR: "10.244.0.0/16"
        bindAddress: 0.0.0.0
        healthzBindAddress: 0.0.0.0:10256
        metricsBindAddress: 0.0.0.0:10249
        clientConnection:
          kubeconfig: /etc/kubernetes/kube-proxy.kubeconfig
    EOF
    
    # 创建 kube-proxy DaemonSet
    kubectl apply -f - <<EOF
    apiVersion: apps/v1
    kind: DaemonSet
    metadata:
      name: kube-proxy
      namespace: kube-system
    spec:
      selector:
        matchLabels:
          k8s-app: kube-proxy
      template:
        metadata:
          labels:
            k8s-app: kube-proxy
        spec:
          hostNetwork: true
          containers:
          - name: kube-proxy
            image: registry.k8s.io/kube-proxy:v1.28.4
            command:
            - /usr/local/bin/kube-proxy
            - --config=/etc/kubernetes/config.conf
            securityContext:
              privileged: true
            volumeMounts:
            - name: config
              mountPath: /etc/kubernetes
          volumes:
          - name: config
            configMap:
              name: kube-proxy
    EOF
    
    ~~~

    ### 删除

    ~~~shell
    kubectl delete deployment,service,configmap,pod,replicaset --selector=app=flink-k8s-cluster
    
    ~~~

    

## 提交Flink任务到Application集群

### 构建镜像

~~~shell
cd flink-1.18.1-app

# 使用 WindowJoin
cat > Dockerfile <<EOF
FROM flink:1.18.1
RUN mkdir -p \$FLINK_HOME/usrlib
COPY --from=flink:1.18.1 /opt/flink/examples/streaming/WindowJoin.jar \$FLINK_HOME/usrlib/job.jar
EOF

docker build -t flink-1.18.1-app:1.0 .

~~~

### 提交任务

~~~shell
./bin/flink run-application \
  -t kubernetes-application \
  -Dkubernetes.cluster-id=flink-1181-app \
  -Dkubernetes.service-account=flink \
  -Dkubernetes.container.image=flink-1.18.1-app:1.0 \
  -Dkubernetes.container.image-pull-policy=IfNotPresent \
  -Dtaskmanager.memory.process.size=1024m \
  -Dkubernetes.taskmanager.cpu=1 \
  -Dtaskmanager.numberOfTaskSlots=2 \
  local:///opt/flink/usrlib/job.jar

2026-01-17 20:11:26,765 INFO  org.apache.flink.kubernetes.utils.KubernetesUtils            [] - Kubernetes deployment requires a fixed port. Configuration blob.server.port will be set to 6124
2026-01-17 20:11:26,766 INFO  org.apache.flink.kubernetes.utils.KubernetesUtils            [] - Kubernetes deployment requires a fixed port. Configuration taskmanager.rpc.port will be set to 6122
2026-01-17 20:11:27,095 WARN  org.apache.flink.kubernetes.KubernetesClusterDescriptor      [] - Please note that Flink client operations(e.g. cancel, list, stop, savepoint, etc.) won't work from outside the Kubernetes cluster since 'kubernetes.rest-service.exposed.type' has been set to ClusterIP.
2026-01-17 20:11:27,101 INFO  org.apache.flink.kubernetes.KubernetesClusterDescriptor      [] - Create flink application cluster flink-1181-app successfully, JobManager Web Interface: http://flink-1181-app-rest.default:8089
~~~

### 查看及清理任务

#### 查看

查看所有pod

~~~shell
➜  flink-1.18.1 kubectl get pods

NAME                              READY   STATUS    RESTARTS   AGE
flink-1181-app-76d5fc4fcf-sj66d   1/1     Running   0          2m
flink-1181-app-taskmanager-1-1    1/1     Running   0          114s
~~~



查看pod状态

~~~shell
➜  flink-1.18.1 kubectl get pods -l app=flink-1181-app -w

NAME                              READY   STATUS    RESTARTS   AGE
flink-1181-app-76d5fc4fcf-sj66d   1/1     Running   0          42s
flink-1181-app-taskmanager-1-1    1/1     Running   0          36s

➜  flink-1.18.1 kubectl get pods -l app=flink-1181-app -o wide

NAME                              READY   STATUS    RESTARTS   AGE     IP               NODE       NOMINATED NODE   READINESS GATES
flink-1181-app-76d5fc4fcf-sj66d   1/1     Running   0          2m15s   192.168.194.24   orbstack   <none>           <none>
flink-1181-app-taskmanager-1-1    1/1     Running   0          2m9s    192.168.194.25   orbstack   <none>           <none>
~~~

#### 停止

直接删除相关资源

~~~shell
# 删除所有与 flink-1181-app 相关的资源
kubectl delete deployment,service,configmap,pod,replicaset --selector=app=flink-1181-app

# 或者使用更精确的标签选择器
kubectl delete all,ing,configmap,secret,serviceaccount,role,rolebinding --selector=app=flink-1181-app

# 确认删除完成
kubectl get pods -l app=flink-1181-app
# 应该返回 "No resources found"

~~~

停止JobManager

~~~shell
# 1. 获取 JobManager Pod 名称
JM_POD=$(kubectl get pods -l app=flink-1181-app,component=jobmanager -o jsonpath='{.items[0].metadata.name}')

# 2. 查看正在运行的作业
kubectl exec -it $JM_POD -- /opt/flink/bin/flink list -r

# 3. 停止指定作业（获取 JobID 后）
kubectl exec -it $JM_POD -- /opt/flink/bin/flink cancel <jobId>

# 4. 等待作业停止后，删除集群资源
kubectl delete deployment,service,configmap --selector=app=flink-1181-app

~~~

#### 特殊情况

情况 1：Pod 处于 CrashLoopBackOff 或 Error状态

~~~shell
# 强制删除 Podkubectl delete pod <pod-name> --force --grace-period=0

#然后删除其他资源
kubectl delete deployment,service,configmap --selector=app=flink-1181-app

~~~

情况 2：资源被卡住无法删除

~~~shell
# 检查是否有 Finalizer
kubectl get deployment flink-1181-app-jobmanager -o yaml | grep finalizers

# 如果有，编辑删除
kubectl patch deployment flink-1181-app-jobmanager -p '{"metadata":{"finalizers":[]}}' --type=merge

#然后删除
kubectl delete deployment,service,configmap --selector=app=flink-1181-app

~~~

情况 3：需要保留日志和状态

~~~shell
# 1. 先导出日志
kubectl logs -l app=flink-1181-app,component=jobmanager --tail=100 > jobmanager.log
kubectl logs -l app=flink-1181-app,component=taskmanager --tail=100 > taskmanager.log

# 2. 导出配置
kubectl get configmap -l app=flink-1181-app -o yaml > flink-config.yaml

# 3. 然后删除资源
kubectl delete deployment,service,configmap --selector=app=flink-1181-app

~~~



#### 清理所有Application模式集群

~~~shell
# 查看所有 Application 模式集群
kubectl get deployments -l app=flink-1181-app

# 删除所有 Application 模式资源
kubectl delete all,configmap,service,ing,secret,role,rolebinding --selector=app=flink-1181-app

# 如果还有其他集群
kubectl delete all,configmap,service --selector=app=flink-example-app
kubectl delete all,configmap,service --selector=app=my-app-cluster

~~~

验证清理结果：

~~~shell
# 确认所有资源已删除
kubectl get pods -l app=flink-1181-app
kubectl get deployments -l app=flink-1181-app
kubectl get services -l app=flink-1181-app
kubectl get configmaps -l app=flink-1181-app

# 检查是否有残留kubectl get all --all-namespaces | grep flink-1181-app

~~~



## 复刻生产环境

步骤1：配置HA

使用本地存储模拟（可忽略）

~~~shell
# 创建本地 HA 存储目录
mkdir -p /tmp/flink-ha-storage
mkdir -p /tmp/flink-job-result-store

# 在你本机创建目录
mkdir -p /tmp/flink-ha-storage
mkdir -p /tmp/flink-checkpoints
mkdir -p /tmp/flink-savepoints


# 创建模拟的 OSS 配置文件
cat > /tmp/oss-config.properties <<EOF
fs.oss.endpoint=oss-cn-shanghai-internal.aliyuncs.com
fs.oss.accessKeyId=mock-access-key
fs.oss.accessKeySecret=mock-secret-key
fs.oss.bucket=prod-svw-zone-bd-private
EOF

~~~

步骤2：创建完整的`flink-conf.yaml`

~~~shell
# 准备好一个flink-conf.yaml文件，并添加适当的初始化参数配置
~~~

步骤3：创建 Kubernetes Volume

~~~shell
# 创建 PersistentVolume（使用 hostPath 模拟）
cat > pv-flink-storage.yaml <<EOF
apiVersion: v1
kind: PersistentVolume
metadata:
  name: flink-storage-pv
spec:
  capacity:
    storage: 50Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  hostPath:
    path: /tmp/flink-storage  # 这里指向你本机的目录
    type: DirectoryOrCreate
EOF

kubectl apply -f pv-flink-storage.yaml

~~~

步骤4：创建 PVC

~~~shell
cat > pvc-flink-storage.yaml <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: flink-storage-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  storageClassName: local-storage
EOF

kubectl apply -f pvc-flink-storage.yaml

~~~

步骤5：创建configMap

~~~shell
# 1. 创建 ConfigMap
kubectl create configmap flink-production-config \
  --from-file=flink-conf.yaml=./flink-conf.yaml
~~~

步骤6：构建镜像

~~~shell
cd ~/flink-app-production

# 1. 复制 JAR 文件到当前目录
cp /Users/roohom/SVW/bdp-realtime/flink-pipeline-platform/target/flink-pipeline-platform-1.0-SNAPSHOT.jar .

# 2. 修改 Dockerfile，使用相对路径
cat > Dockerfile <<EOF
FROM flink:1.18.1

# 创建必要的目录
RUN mkdir -p \$FLINK_HOME/usrlib \\
    && mkdir -p /opt/flink/ha \\
    && mkdir -p /opt/flink/checkpoints \\
    && mkdir -p /opt/flink/savepoints \\
    && mkdir -p /opt/flink/job-result-store

# 复制作业 JAR（使用相对路径）
COPY flink-pipeline-platform-1.0-SNAPSHOT.jar \$FLINK_HOME/usrlib/

# 设置权限
RUN chown -R flink:flink /opt/flink

# 切换到 flink 用户
USER flink

# 暴露端口
EXPOSE 6123 6124 6125 9249 8081
EOF

# 3. 重新构建镜像
docker build -t flink-1.18.1-production:1.0 .
# 强制重新构建，忽略缓存
docker build --no-cache -t flink-1.18.1-production:1.0 .

docker images | grep flink-1.18.1-production

# 查看镜像内的内容
docker run --rm -it flink-1.18.1-production:1.0 ls -l /opt/flink
~~~



### 提交作业

~~~shell
# 提交前先删除已有的相关资源
kubectl delete deployment,service,configmap,pod,replicaset --selector=app=flink-lakelink-pipeline-platform-job

# 提交
./bin/flink run-application \
  -t kubernetes-application \
  -Dkubernetes.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dkubernetes.service-account=flink \
  -Dkubernetes.container.image=flink-1.18.1-production:1.0 \
  -Dkubernetes.container.image-pull-policy=Always \
  -Dkubernetes.configmap.name=flink-production-config \
  -Dkubernetes.volumes.persistentvolumeclaim.claim-name=flink-storage-pvc \
  -Dkubernetes.volumes.persistentvolumeclaim.mount-path=/opt/flink-storage \
  -Dkubernetes.pod-template-file.name=flink-pod-template \
  -Dkubernetes.pod-template-file.key=/Users/roohom/export/service/flink-app-production/pod-template.yaml \
  local:///opt/flink/usrlib/flink-pipeline-platform-1.0-SNAPSHOT.jar \
  --service sql-executor \
  --mode STREAMING \
  --file classpath:sample.sql
  
  
  
#############
## 启动之后，flink页面常驻不会主动关闭
./bin/flink run-application \
  -t kubernetes-application \
  -Dexecution.shutdown-on-application-finish=false \
  -Dexecution.submit-failed-job-on-application-error=true \
  -Djob-result-store.delete-on-commit=false \
  -Dkubernetes.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dkubernetes.service-account=flink \
  -Dkubernetes.container.image=flink-1.18.1-production:1.0 \
  -Dkubernetes.container.image-pull-policy=Always \
  -Dhigh-availability=org.apache.flink.kubernetes.highavailability.KubernetesHaServicesFactory \
  -Dhigh-availability.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dhigh-availability.jobmanager.port=6123 \
  -Dhigh-availability.storageDir=file:///opt/flink/ha \
  -Dkubernetes.configmap.name=flink-production-config \
  -Dkubernetes.pod-template-file.name=flink-pod-template \
  -Dkubernetes.pod-template-file.key=/Users/roohom/export/service/flink-app-production/pod-template.yaml \
  local:///opt/flink/usrlib/flink-pipeline-platform-1.0-SNAPSHOT.jar \
  --service sql-executor \
  --mode STREAMING \
  --file classpath:sample.sql
  

#使用这个命令提交，任务结束后会退出，pod会消失
./bin/flink run-application \
  -t kubernetes-application \
  -Dexecution.shutdown-on-application-finish=true \
  -Dexecution.submit-failed-job-on-application-error=true \
  -Djob-result-store.delete-on-commit=false \
  -Dkubernetes.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dkubernetes.service-account=flink \
  -Dkubernetes.container.image=flink-1.18.1-production:1.0 \
  -Dkubernetes.container.image-pull-policy=Always \
  -Dhigh-availability=org.apache.flink.kubernetes.highavailability.KubernetesHaServicesFactory \
  -Dhigh-availability.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dhigh-availability.jobmanager.port=6123 \
  -Dhigh-availability.storageDir=file:///opt/flink/ha \
  -Dkubernetes.configmap.name=flink-production-config \
  -Dkubernetes.pod-template-file.name=flink-pod-template \
  -Dkubernetes.pod-template-file.key=/Users/roohom/export/service/flink-app-production/pod-template.yaml \
  local:///opt/flink/usrlib/flink-pipeline-platform-1.0-SNAPSHOT.jar \
  --service sql-executor \
  --mode BATCH
  

#测试循环提交任务，设置table.dml-sync=true
# 第一个sql会执行，当开始提交第二个任务的时候，报不能有多个execute，页面也会刷新(任务fallover了)，提交新的任务，但还是从第一个sql开始执行
# Caused by: org.apache.flink.util.FlinkRuntimeException: Cannot have more than one execute() or executeAsync() call in a single environment.
./bin/flink run-application \
  -t kubernetes-application \
  -Dexecution.shutdown-on-application-finish=true \
  -Dexecution.submit-failed-job-on-application-error=true \
  -Djob-result-store.delete-on-commit=false \
  -Dkubernetes.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dkubernetes.service-account=flink \
  -Dkubernetes.container.image=flink-1.18.1-production:1.0 \
  -Dkubernetes.container.image-pull-policy=Always \
  -Dhigh-availability=org.apache.flink.kubernetes.highavailability.KubernetesHaServicesFactory \
  -Dhigh-availability.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dhigh-availability.jobmanager.port=6123 \
  -Dhigh-availability.storageDir=file:///opt/flink/ha \
  -Dkubernetes.configmap.name=flink-production-config \
  -Dkubernetes.pod-template-file.name=flink-pod-template \
  -Dkubernetes.pod-template-file.key=/Users/roohom/export/service/flink-app-production/pod-template.yaml \
  local:///opt/flink/usrlib/flink-pipeline-platform-1.0-SNAPSHOT.jar \
  --service sample-service \
  --mode BATCH \
  -D table.dml-sync=true


# Caused by: org.apache.flink.util.FlinkRuntimeException: Cannot have more than one execute() or executeAsync() call in a single environment.
./bin/flink run-application \
  -t kubernetes-application \
  -Dexecution.shutdown-on-application-finish=false \
  -Dexecution.submit-failed-job-on-application-error=true \
  -Djob-result-store.delete-on-commit=false \
  -Dkubernetes.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dkubernetes.service-account=flink \
  -Dkubernetes.container.image=flink-1.18.1-production:1.0 \
  -Dkubernetes.container.image-pull-policy=Always \
  -Dhigh-availability=org.apache.flink.kubernetes.highavailability.KubernetesHaServicesFactory \
  -Dhigh-availability.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dhigh-availability.jobmanager.port=6123 \
  -Dhigh-availability.storageDir=file:///opt/flink/ha \
  -Dkubernetes.configmap.name=flink-production-config \
  -Dkubernetes.pod-template-file.name=flink-pod-template \
  -Dkubernetes.pod-template-file.key=/Users/roohom/export/service/flink-app-production/pod-template.yaml \
  local:///opt/flink/usrlib/flink-pipeline-platform-1.0-SNAPSHOT.jar \
  --service sample-service \
  --mode BATCH \
  -D table.dml-sync=true
  

# Caused by: org.apache.flink.util.FlinkException: Could not retrieve submitted JobGraph from state handle under jobGraph-ffffffffdf3765f70000000000000000. This indicates that the retrieved state handle is broken. Try cleaning the state handle store.
./bin/flink run-application \
  -t kubernetes-application \
  -Dexecution.shutdown-on-application-finish=false \
  -Dexecution.submit-failed-job-on-application-error=true \
  -Djob-result-store.delete-on-commit=false \
  -Dkubernetes.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dkubernetes.service-account=flink \
  -Dkubernetes.container.image=flink-1.18.1-production:1.0 \
  -Dkubernetes.container.image-pull-policy=Always \
  -Dhigh-availability=org.apache.flink.kubernetes.highavailability.KubernetesHaServicesFactory \
  -Dhigh-availability.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dhigh-availability.jobmanager.port=6123 \
  -Dhigh-availability.storageDir=file:///opt/flink/ha \
  -Dkubernetes.configmap.name=flink-production-config \
  -Dkubernetes.pod-template-file.name=flink-pod-template \
  -Dkubernetes.pod-template-file.key=/Users/roohom/export/service/flink-app-production/pod-template.yaml \
  local:///opt/flink/usrlib/flink-pipeline-platform-1.0-SNAPSHOT.jar \
  --service sample-service \
  --mode BATCH 


# Caused by: org.apache.flink.util.FlinkRuntimeException: Cannot have more than one execute() or executeAsync() call in a single environment.
./bin/flink run-application \
  -t kubernetes-application \
  -Dexecution.shutdown-on-application-finish=false \
  -Dexecution.submit-failed-job-on-application-error=true \
  -Dkubernetes.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dkubernetes.service-account=flink \
  -Dkubernetes.container.image=flink-1.18.1-production:1.0 \
  -Dkubernetes.container.image-pull-policy=Always \
  -Dhigh-availability=org.apache.flink.kubernetes.highavailability.KubernetesHaServicesFactory \
  -Dhigh-availability.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dhigh-availability.jobmanager.port=6123 \
  -Dhigh-availability.storageDir=file:///opt/flink/ha \
  -Dkubernetes.configmap.name=flink-production-config \
  -Dkubernetes.pod-template-file.name=flink-pod-template \
  -Dkubernetes.pod-template-file.key=/Users/roohom/export/service/flink-app-production/pod-template.yaml \
  local:///opt/flink/usrlib/flink-pipeline-platform-1.0-SNAPSHOT.jar \
  --service sample-service \
  --mode BATCH 



# 执行完第一个sql后开始重试
# Caused by: org.apache.flink.util.FlinkRuntimeException: Cannot have more than one execute() or executeAsync() call in a single environment.
./bin/flink run-application \
  -t kubernetes-application \
  -Dexecution.shutdown-on-application-finish=false \
  -Dexecution.submit-failed-job-on-application-error=true \
  -Dkubernetes.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dkubernetes.service-account=flink \
  -Dkubernetes.container.image=flink-1.18.1-production:1.0 \
  -Dkubernetes.container.image-pull-policy=Always \
  -Dhigh-availability=org.apache.flink.kubernetes.highavailability.KubernetesHaServicesFactory \
  -Dhigh-availability.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dhigh-availability.jobmanager.port=6123 \
  -Dhigh-availability.storageDir=file:///opt/flink/ha \
  -Dkubernetes.configmap.name=flink-production-config \
  -Dkubernetes.pod-template-file.name=flink-pod-template \
  -Dkubernetes.pod-template-file.key=/Users/roohom/export/service/flink-app-production/pod-template.yaml \
  local:///opt/flink/usrlib/flink-pipeline-platform-1.0-SNAPSHOT.jar \
  --service sample-service \
  --mode BATCH \
  -D table.dml-sync=true


# 取消HA模式，直接提交，可以成功提交任务，可以循环提交任务，和YARN上的效果一样，可以确定是HA模式下不能够提交多个任务
# jm不会回收
./bin/flink run-application \
  -t kubernetes-application \
  -Dexecution.shutdown-on-application-finish=false \
  -Dkubernetes.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dkubernetes.service-account=flink \
  -Dkubernetes.container.image=flink-1.18.1-production:1.0 \
  -Dkubernetes.container.image-pull-policy=Always \
  -Dkubernetes.configmap.name=flink-production-config \
  -Dkubernetes.pod-template-file.name=flink-pod-template \
  -Dkubernetes.pod-template-file.key=/Users/roohom/export/service/flink-app-production/pod-template.yaml \
  local:///opt/flink/usrlib/flink-pipeline-platform-1.0-SNAPSHOT.jar \
  --service sample-service \
  --mode BATCH \
  -D table.dml-sync=true

#JM会回收
./bin/flink run-application \
  -t kubernetes-application \
  -Dexecution.shutdown-on-application-finish=true \
  -Dkubernetes.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dkubernetes.service-account=flink \
  -Dkubernetes.container.image=flink-1.18.1-production:1.0 \
  -Dkubernetes.container.image-pull-policy=Always \
  -Dkubernetes.configmap.name=flink-production-config \
  -Dkubernetes.pod-template-file.name=flink-pod-template \
  -Dkubernetes.pod-template-file.key=/Users/roohom/export/service/flink-app-production/pod-template.yaml \
  local:///opt/flink/usrlib/flink-pipeline-platform-1.0-SNAPSHOT.jar \
  --service sample-service \
  --mode BATCH \
  -D table.dml-sync=true

./bin/flink run-application \
  -t kubernetes-application \
  -Dexecution.shutdown-on-application-finish=true \
  -Dkubernetes.jobmanager.replicas=1 \
  -Dkubernetes.cluster-id=flink-lakelink-pipeline-platform-job \
  -Dkubernetes.service-account=flink \
  -Dkubernetes.container.image=flink-1.18.1-production:1.8 \
  -Dkubernetes.container.image-pull-policy=Always \
  local:///opt/flink/usrlib/flink-pipeline-platform-1.0-SNAPSHOT.jar \
  --service sample-service \
  --mode BATCH \
  -D table.dml-sync=true
~~~



### 查看日志

~~~shell
POD_NAME=$(kubectl get pods -l app=flink-lakelink-pipeline-platform-job -o jsonpath='{.items[0].metadata.name}')

kubectl exec -it $POD_NAME -- cat /opt/flink/log/flink.log
~~~



## 使用代码提交Application模式的Flink任务到K8s集群

### 重点说明

其中

~~~java
flinkConfig.set(DeploymentOptionsInternal.CONF_DIR,FLINK_CONF_DIR);
~~~

是关键代码，因为flink在启动后，创建pod前会设置**将本地的flink conf目录下的文件挂载到容器内的路径**，以覆盖和使用用户传入的实际配置。这些文件包括

- flink-conf.yaml
- log4j-console.properties
- 其他配置

如果不设置，pod依旧会创建，程序可以运行，但是将会看不到日志，因为它默认的配置是`/opt/flink/conf，而用户很容易忽略掉这个位置，这个目录本机一般不会存在，除非你手动创建，实际上，flink任务启动，相关配置文件默认就是从这个目录加载、读入并挂载到容器内的，这个默认位置详情可见：org.apache.flink.kubernetes.configuration.KubernetesConfigOptions#FLINK_CONF_DIR

~~~java
public static final ConfigOption<String> FLINK_CONF_DIR =
        key("kubernetes.flink.conf.dir")
                .stringType()
                .defaultValue("/opt/flink/conf")
                .withDescription(
                        "The flink conf directory that will be mounted in pod. The flink-conf.yaml, log4j.properties, "
                                + "logback.xml in this path will be overwritten from config map.");
~~~

这些挂载操作是由这个类：`org.apache.flink.kubernetes.kubeclient.decorators.FlinkConfMountDecorator`完成的，这里使用了装饰器模式

~~~java
public FlinkPod decorateFlinkPod(FlinkPod flinkPod) {
    final Pod mountedPod = decoratePod(flinkPod.getPodWithoutMainContainer());

    final Container mountedMainContainer =
            new ContainerBuilder(flinkPod.getMainContainer())
                    .addNewVolumeMount()
                    .withName(FLINK_CONF_VOLUME)
                    .withMountPath(kubernetesComponentConf.getFlinkConfDirInPod())
                    .endVolumeMount()
                    .build();

    return new FlinkPod.Builder(flinkPod)
            .withPod(mountedPod)
            .withMainContainer(mountedMainContainer)
            .build();
}

private List<File> getLocalLogConfFiles() {
    final String confDir = kubernetesComponentConf.getConfigDirectory();
    final File logbackFile = new File(confDir, CONFIG_FILE_LOGBACK_NAME);
    final File log4jFile = new File(confDir, CONFIG_FILE_LOG4J_NAME);

    List<File> localLogConfFiles = new ArrayList<>();
    if (logbackFile.exists()) {
        localLogConfFiles.add(logbackFile);
    }
    if (log4jFile.exists()) {
        localLogConfFiles.add(log4jFile);
    }

    return localLogConfFiles;
}
~~~

### 本地模拟提交Flink任务至K8s集群

以下代码参考flink源码和streampark源码，事实上，streampark就是这么做的，提取了flink提交任务的核心代码。

以下代码可以拓展延伸至提交flink任务到yarn上，后续研究。

~~~java
package com.csvw.pipeplat.deployment;

import org.apache.flink.client.deployment.ClusterDeploymentException;
import org.apache.flink.client.deployment.ClusterSpecification;
import org.apache.flink.client.deployment.application.ApplicationConfiguration;
import org.apache.flink.client.program.ClusterClient;
import org.apache.flink.configuration.*;
import org.apache.flink.kubernetes.KubernetesClusterClientFactory;
import org.apache.flink.kubernetes.KubernetesClusterDescriptor;
import org.apache.flink.kubernetes.configuration.KubernetesConfigOptions;

import java.util.Arrays;
import java.util.Collections;

public class KubernetesDeploymentTest {
    private static final String APPLICATION_MAIN_CLASS_NAME = "com.csvw.pipeplat.Application";
    private static final String FLINK_HOME = "/Users/roohom/export/service/flink-1.18.1/";
    private static final String FLINK_CONF_DIR = "/Users/roohom/export/service/flink-1.18.1/conf";
    private static final String FLINK_CONF_YAML = "/Users/roohom/export/service/flink-1.18.1/conf/flink-conf.yaml";

    public static void main(String[] args) throws ClusterDeploymentException {
        // 1. 创建Flink配置
        //Configuration flinkConfig = new Configuration();
        Configuration flinkConfig = GlobalConfiguration.loadConfiguration(FLINK_CONF_DIR);

        // /opt/flink/conf
        if (!flinkConfig.contains(DeploymentOptionsInternal.CONF_DIR)) {
            flinkConfig.set(DeploymentOptionsInternal.CONF_DIR,
                    FLINK_CONF_DIR);
        }
        // 核心Kubernetes配置
        flinkConfig.set(DeploymentOptions.TARGET, "kubernetes-application");
        flinkConfig.set(KubernetesConfigOptions.CLUSTER_ID, "flink-lakelink-pipeline-platform-job");
        flinkConfig.set(KubernetesConfigOptions.NAMESPACE, "default");
        flinkConfig.set(KubernetesConfigOptions.CONTAINER_IMAGE, "flink-1.18.1-production:2.0");
        flinkConfig.set(KubernetesConfigOptions.REST_SERVICE_EXPOSED_TYPE,
                KubernetesConfigOptions.ServiceExposedType.ClusterIP);

        // 应用程序配置
        flinkConfig.set(PipelineOptions.JARS,
                Collections.singletonList("local:///opt/flink/usrlib/flink-pipeline-platform-1.0-SNAPSHOT.jar"));

        // 配置应用程序
        flinkConfig.set(ApplicationConfiguration.APPLICATION_ARGS,
                Arrays.asList(
                        "--service", "sample-service",
                        "--mode", "BATCH",
                        "-D", "table.dml-sync=true"
                ));
        ApplicationConfiguration applicationConfig = ApplicationConfiguration.fromConfiguration(flinkConfig);

        // 资源配置
        flinkConfig.set(JobManagerOptions.TOTAL_PROCESS_MEMORY, MemorySize.parse("1g")); // 增加JM内存
        flinkConfig.set(TaskManagerOptions.TOTAL_PROCESS_MEMORY, MemorySize.parse("2g")); // 增加TM内存
        flinkConfig.set(TaskManagerOptions.CPU_CORES, 1.0); // 添加CPU配置
        flinkConfig.set(TaskManagerOptions.NUM_TASK_SLOTS, 2); // 设置TM槽位

        // Kubernetes特定配置
        flinkConfig.set(KubernetesConfigOptions.JOB_MANAGER_SERVICE_ACCOUNT, "flink"); // 设置ServiceAccount
        flinkConfig.set(KubernetesConfigOptions.TASK_MANAGER_SERVICE_ACCOUNT, "flink"); // 设置ServiceAccount
        flinkConfig.set(KubernetesConfigOptions.CONTAINER_IMAGE_PULL_POLICY, KubernetesConfigOptions.ImagePullPolicy.IfNotPresent);


        // 创建集群描述符和规格
        KubernetesClusterClientFactory factory = new KubernetesClusterClientFactory();
        KubernetesClusterDescriptor clusterDescriptor = factory.createClusterDescriptor(flinkConfig);
        ClusterSpecification clusterSpecification = factory.getClusterSpecification(flinkConfig);


        // 提交作业到Kubernetes集群 clusterClient
        ClusterClient<String> clusterClient = clusterDescriptor
                .deployApplicationCluster(clusterSpecification, applicationConfig)
                .getClusterClient();

        // 处理提交结果
        String clusterId = clusterClient.getClusterId();
        String webInterfaceUrl = clusterClient.getWebInterfaceURL();

        System.out.printf("Flink application submitted successfully!%n");
        System.out.printf("Cluster ID: %s%n", clusterId);
        System.out.printf("Web Interface: %s%n", webInterfaceUrl);

        // 6. 关闭资源
        clusterClient.close();
        clusterDescriptor.close();
    }
}
~~~





## 总结

1、批任务完成后不退出

~~~yaml
execution.shutdown-on-application-finish: false
~~~

如果在启动参数中指定

~~~shell
-Dexecution.shutdown-on-application-finish=false
~~~

批任务任务运行完成之后，页面不会关闭，资源不会收回，JobManager不会回收



2、批模式下循环提交多任务依次执行

在HA模式下，循环提交多任务，

不设置`table.dml-sync=true`,会报错：

~~~log
Caused by: org.apache.flink.util.FlinkRuntimeException: Cannot have more than one execute() or executeAsync() call in a single environment.
~~~

设置`table.dml-sync=true`,会在成功执行完第一个insert sql后报错：

~~~log
Caused by: org.apache.flink.util.FlinkRuntimeException: Cannot have more than one execute() or executeAsync() call in a single environment.
~~~

如果配置了job-result-store，并配合`job-result-store.delete-on-commit=false`第一个sql运行完成后，重启运行，继续运行第一个sql，但是第一个sql的状态是完成，不会继续执行

<u>当取消HA模式提交之后，可以循环提交多任务依次执行，效果和YARN上一致</u>

而如果使用streampark创建容器并提交任务，无法实现批任务循环提交并执行insert语句，因为它在提交flink任务的配置准备阶段会自动设置一个JobId给这个参数：`$internal.pipeline.job-id`，这个参数位于`org.apache.flink.configuration.PipelineOptionsInternal`

~~~java
public static final ConfigOption<String> PIPELINE_FIXED_JOB_ID =
        key("$internal.pipeline.job-id")
                .stringType()
                .noDefaultValue()
                .withDescription(
                        "**DO NOT USE** The static JobId to be used for the specific pipeline. "
                                + "For fault-tolerance, this value needs to stay the same across runs.");
~~~

如果这个参数被固定，再配合`job-result-store.delete-on-commit=false`，同一jobid的运行结果状态会保存，当提交第二个insert语句时，由于运行结果已保存，flink会拿到已完成的状态，则会忽略提交，任务将结束。

以下是日志佐证：

~~~log
2026-01-16 14:40:15,416 INFO  org.apache.paimon.flink.FlinkCatalog                         [] - Skipping listPartitions method due to detection of FlinkRecomputeStatisticsProgram call.
2026-01-16 14:40:18,039 INFO  org.apache.flink.api.java.typeutils.TypeExtractor            [] - class org.apache.paimon.flink.FlinkRowWrapper does not contain a getter for field row
2026-01-16 14:40:18,039 INFO  org.apache.flink.api.java.typeutils.TypeExtractor            [] - class org.apache.paimon.flink.FlinkRowWrapper does not contain a setter for field row
2026-01-16 14:40:18,039 INFO  org.apache.flink.api.java.typeutils.TypeExtractor            [] - Class class org.apache.paimon.flink.FlinkRowWrapper cannot be used as a POJO type because not all fields are valid POJO fields, and must be processed as GenericType. Please read the Flink documentation on "Data Types & Serialization" for details of the effect on performance and schema evolution.
2026-01-16 14:40:18,085 INFO  org.apache.flink.streaming.api.graph.StreamGraphGenerator    [] - Disabled Checkpointing. Checkpointing is not supported and not needed when executing jobs in BATCH mode.
2026-01-16 14:40:18,300 INFO  org.apache.flink.client.deployment.application.executors.EmbeddedExecutor [] - Job 1e6b59f13353b7c399dca65bd247bd14 is submitted.
2026-01-16 14:40:18,300 INFO  org.apache.flink.client.deployment.application.executors.EmbeddedExecutor [] - Submitting Job with JobId=1e6b59f13353b7c399dca65bd247bd14.
2026-01-16 14:40:18,400 INFO  org.apache.flink.runtime.blob.FileSystemBlobStore            [] - Creating highly available BLOB storage directory at oss://prod-svw-zone-bd-private.cn-shanghai.oss-dls.aliyuncs.com/flink/ha/flink-lakelink-canlin-signal-hour-svw/blob
2026-01-16 14:40:18,719 INFO  org.apache.flink.runtime.dispatcher.StandaloneDispatcher     [] - Received JobGraph submission 'canlin-service-20251015-00-1768545613492' (1e6b59f13353b7c399dca65bd247bd14).
2026-01-16 14:40:18,726 WARN  org.apache.flink.runtime.dispatcher.StandaloneDispatcher     [] - Ignoring JobGraph submission 'canlin-service-20251015-00-1768545613492' (1e6b59f13353b7c399dca65bd247bd14) because the job already reached a globally-terminal state (i.e. FAILED, CANCELED, FINISHED) in a previous execution.
2026-01-16 14:40:18,731 INFO  org.apache.flink.client.deployment.application.ApplicationDispatcherBootstrap [] - Application completed SUCCESSFULLY
2026-01-16 14:41:11,094 INFO  org.apache.flink.runtime.resourcemanager.active.ActiveResourceManager [] - need release 1 workers, current worker number 1, declared worker number 0
2026-01-16 14:41:11,094 INFO  org.apache.flink.runtime.resourcemanager.active.ActiveResourceManager [] - Stopping worker flink-lakelink-canlin-signal-hour-svw-taskmanager-1-1.
2026-01-16 14:41:11,095 INFO  org.apache.flink.kubernetes.KubernetesResourceManagerDriver  [] - Stopping TaskManager pod flink-lakelink-canlin-signal-hour-svw-taskmanager-1-1.
2026-01-16 14:41:11,095 INFO  org.apache.flink.runtime.resourcemanager.active.ActiveResourceManager [] - Closing TaskExecutor connection flink-lakelink-canlin-signal-hour-svw-taskmanager-1-1 because: slot manager has determined that the resource is no longer needed
2026-01-16 14:41:11,095 INFO  org.apache.flink.runtime.resourcemanager.slotmanager.FineGrainedSlotManager [] - Unregistering task executor aa5e0b244e0f781eeb95ff1b300b9aac from the slot manager.
~~~

其中有一句：

~~~log
[] - Ignoring JobGraph submission 'canlin-service-20251015-00-1768545613492' (1e6b59f13353b7c399dca65bd247bd14) because the job already reached a globally-terminal state (i.e. FAILED, CANCELED, FINISHED) in a previous execution.
~~~





