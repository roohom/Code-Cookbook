# [Flink]ProcessFunction无法使用，抛出InvalidProgramException

在flink中有时候需要使用侧边流来收集数据，做另一步处理，就像如下这样：

~~~java
stream.process(
new ProcessFunction(T, O){
            @Override
        public void processElement(String value, Context context, Collector<String> collector) throws Exception {
            JsonNode jsonNode = objectMapper.readTree(value);
            //主流输出
            if (value != null && jsonNode.get("aaa") != null) {
                collector.collect(value);
            }
            //侧边流输出
            if (value != null && jsonNode.get("bbb") != null) {
                context.output(outputTag, value);
            }
        }
}
)
~~~

一切看似都很美好，符合定义的写法，不错，执行起来却抛出了异常，主要信息如下：

~~~java
Caused by:
org.apache.flink.api.common.InvalidProgramException: The implementation of the MapFunction is not serializable. The implementation accesses fields of its enclosing class, which is a common reason for non-serializability. A common solution is to make the function a proper (non-inner) class, or a static inner class.
~~~

大致内容是说，对于MapFunction的实现不是可序列化的，实现去获取封闭类的字段是常见的不可序列化的原因。一个通用的解决办法就是使得这个函数为非内部类，或者一个静态内部类。



解决办法已经说得很清楚了，只要我们让这个ProcessFunction为非内部类或者为静态内部类就可以了。OK知道怎么做了就好，下面进行改造：

~~~java
public static class SplitStreamFunction extends ProcessFunction<String, String> implements Serializable {
        @Override
        public void processElement(String value, Context context, Collector<String> collector) throws Exception {
            JsonNode jsonNode = objectMapper.readTree(value);
            //主流输出
            if (value != null && jsonNode.get("aaa") != null) {
                collector.collect(value);
            }
            //侧边流输出
            if (value != null && jsonNode.get("bbb") != null) {
                context.output(outputTag, value);
            }
        }
    }
~~~

这个类被生命为静态的而且是内部类，实现Serializable接口。



再次运行，异常派出，程序正常运行了。仅此记录。