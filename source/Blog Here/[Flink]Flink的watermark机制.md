# [Flink]Flink中自定义watermark生成器

## watermark是什么

Flink是一个在有界和无界数据流上的状态计算引擎，大量引用在实时流处理。实时数据流中往往数据到达会存在多种问题，比如乱序，水位线机制的引入很好地解决了时间语义问题。

> The mechanism in Flink to measure progress in event time is **watermarks**. Watermarks flow as part of the data stream and carry a timestamp *t*. A *Watermark(t)* declares that event time has reached time *t* in that stream, meaning that there should be no more elements from the stream with a timestamp *t' <= t* (i.e. events with timestamps older or equal to the watermark).

Flink中测量事件时间进展的机制是水印。水印作为数据流的一部分，并携带时间戳t。水印(t)声明事件时间在该流中已经达到时间t，这意味着流中不应该再有时间戳t <= t的元素(即时间戳比水印更早或等于水印的事件)。



简而言之就是水位线被插入到数据流中，作为流的一部分，用作一个事件标记，表示时间推进到了某一时刻。

以下对水位线的实现和内部原理不做过多介绍，详细地可以去参考[Flink官网](https://nightlies.apache.org/flink/flink-docs-release-1.13/docs/concepts/time/#event-time-and-watermarks)。

## 一个问题

一个包含事件时间watermark处理的实时流任务(Keyed Stream)一般代码结构如下:

~~~java
final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

DataStream<MyEvent> stream = env.readFile(
        myFormat, myFilePath, FileProcessingMode.PROCESS_CONTINUOUSLY, 100,
        FilePathFilter.createDefaultFilter(), typeInfo);

DataStream<MyEvent> withTimestampsAndWatermarks = stream
        .filter( event -> event.severity() == WARNING )
        .assignTimestampsAndWatermarks(<watermark strategy>);

withTimestampsAndWatermarks
        .keyBy( (event) -> event.getGroup() )
        .window(TumblingEventTimeWindows.of(Time.seconds(10)))
        .reduce( (a, b) -> a.add(b) )
        .addSink(...);
~~~

水位线被分配在数据流初始阶段，随后接着keyby算子将流划分不同的partition，随后是分配窗口，接着是一个计算算子reduce或者低阶的process函数。

当一个流中数据较少，如果在某一时刻，上游突然不在发送数据，那么总有一些数据不能触发窗口计算。因为根据watermark原理，水位线时间是不断向前推进的，只有新的数据到来，事件时间(如果是事件语义)超过了窗口的结束时间，这个窗口内的计算才会触发，窗口的数据才会被处理。

问题简化:

**如果一个任务启动，上游仅仅发送一条数据，那么这一条数据的事件时间永远也不会触发窗口计算。**

在解决这个问题之前，我们先看看`WatermarkStrategy`以及Flink框架式如果产生水印的。

## WatermarkStrategy

为了处理事件时间，Flink需要知道事件时间戳，这意味着流中的每个元素都需要分配其事件时间戳。这通常是通过使用TimestampAssigner从元素中的某个字段访问/提取时间戳来实现的。

~~~java
public interface WatermarkStrategy<T> 
    extends TimestampAssignerSupplier<T>,
            WatermarkGeneratorSupplier<T>{

    /**
     * Instantiates a {@link TimestampAssigner} for assigning timestamps according to this
     * strategy.
     */
    @Override
    TimestampAssigner<T> createTimestampAssigner(TimestampAssignerSupplier.Context context);

    /**
     * Instantiates a WatermarkGenerator that generates watermarks according to this strategy.
     */
    @Override
    WatermarkGenerator<T> createWatermarkGenerator(WatermarkGeneratorSupplier.Context context);
}
~~~

水印的生成包括了两个部分

1、一个是为数据流分配时间，如果是事件时间，就是从数据流中的元素中提取并分配

2、一个是水印生成器，用来生成和更新水印

我们来看一个具体的代码和背后是如果作用的

~~~java
source.assignTimestampsAndWatermarks(WatermarkStrategy
                .<String>forBoundedOutOfOrderness(Duration.ofSeconds(2))
                //自定义watermark,这里必须用lambada表达式，否则会报watermarkStrategy不能序列化
                //.<String>forGenerator((WatermarkGeneratorSupplier<String>) context -> new BoundedOutOfOrdernessWatermarkBasedOnEventTime(Duration.ofSeconds(5), Duration.ofSeconds(60), autoWatermarkInterval))
                //.forGenerator(new WatermarkGeneratorSupplier<String>() {
                //    @Override
                //    public WatermarkGenerator<String> createWatermarkGenerator(Context context) {
                //        return new BoundedOutOfOrdernessWatermarkBasedOnEventTime(Duration.ofSeconds(1), Duration.ofSeconds(100), autoWatermarkInterval);
                //    }
                //})
                //.<String>forBoundedOutOfOrderness(Duration.ofSeconds(2))
                .withTimestampAssigner(new SerializableTimestampAssigner<String>() {
                    @Override
                    public long extractTimestamp(String element, long recordTimestamp) {
                        if (element != null) {
                            return JSONObject.parseObject(element).getLong("timestamp") * 1000;
                        }
                        return recordTimestamp;
                    }
                })
                .withIdleness(Duration.ofSeconds(60))
        );
~~~

1、从元素中解析`timestamp`得到时间作为事件时间，使用的是`SerializableTimestampAssigner`事件时间分配器，它继承了`TimestampAssigner`接口，

~~~java
/** A {@link TimestampAssigner} that is also {@link java.io.Serializable}. */
@PublicEvolving
@FunctionalInterface
public interface SerializableTimestampAssigner<T> extends TimestampAssigner<T>, Serializable {}
~~~

用户需要自己实现`extractTimestamp`方法

~~~java
@Public
@FunctionalInterface
public interface TimestampAssigner<T> {

    /**
     * The value that is passed to {@link #extractTimestamp} when there is no previous timestamp
     * attached to the record.
     */
    long NO_TIMESTAMP = Long.MIN_VALUE;

    /**
     * Assigns a timestamp to an element, in milliseconds since the Epoch. This is independent of
     * any particular time zone or calendar.
     *
     * <p>The method is passed the previously assigned timestamp of the element. That previous
     * timestamp may have been assigned from a previous assigner. If the element did not carry a
     * timestamp before, this value is {@link #NO_TIMESTAMP} (= {@code Long.MIN_VALUE}: {@value
     * Long#MIN_VALUE}).
     *
     * @param element The element that the timestamp will be assigned to.
     * @param recordTimestamp The current internal timestamp of the element, or a negative value, if
     *     no timestamp has been assigned yet.
     * @return The new timestamp.
     */
    long extractTimestamp(T element, long recordTimestamp);
}
~~~



2、使用Flink框架默认提供的`BoundedOutOfOrdernessWatermarks,`允许一定的乱序,我们来看看它的源码

~~~java
/**
 * A WatermarkGenerator for situations where records are out of order, but you can place an upper
 * bound on how far the events are out of order. An out-of-order bound B means that once an event
 * with timestamp T was encountered, no events older than {@code T - B} will follow any more.
 *
 * <p>The watermarks are generated periodically. The delay introduced by this watermark strategy is
 * the periodic interval length, plus the out-of-orderness bound.
 */
@Public
public class BoundedOutOfOrdernessWatermarks<T> implements WatermarkGenerator<T> {

    /** The maximum timestamp encountered so far. */
    private long maxTimestamp;

    /** The maximum out-of-orderness that this watermark generator assumes. */
    private final long outOfOrdernessMillis;

    /**
     * Creates a new watermark generator with the given out-of-orderness bound.
     *
     * @param maxOutOfOrderness The bound for the out-of-orderness of the event timestamps.
     */
    public BoundedOutOfOrdernessWatermarks(Duration maxOutOfOrderness) {
        checkNotNull(maxOutOfOrderness, "maxOutOfOrderness");
        checkArgument(!maxOutOfOrderness.isNegative(), "maxOutOfOrderness cannot be negative");

        this.outOfOrdernessMillis = maxOutOfOrderness.toMillis();

        // start so that our lowest watermark would be Long.MIN_VALUE.
        this.maxTimestamp = Long.MIN_VALUE + outOfOrdernessMillis + 1;
    }

    // ------------------------------------------------------------------------

    @Override
    public void onEvent(T event, long eventTimestamp, WatermarkOutput output) {
        maxTimestamp = Math.max(maxTimestamp, eventTimestamp);
    }

    @Override
    public void onPeriodicEmit(WatermarkOutput output) {
        output.emitWatermark(new Watermark(maxTimestamp - outOfOrdernessMillis - 1));
    }
}

~~~

`BoundedOutOfOrdernessWatermarks`在被实例化的时候，有一个最大时间戳maxTimestamp被赋值为`Long.MIN_VALUE + outOfOrdernessMillis + 1`，这个也就是水位线的初始时间值。

同时`BoundedOutOfOrdernessWatermarks`实现了`WatermarkGenerator`接口

~~~java
/**
 * The {@code WatermarkGenerator} generates watermarks either based on events or periodically (in a
 * fixed interval).
 *
 * <p><b>Note:</b> This WatermarkGenerator subsumes the previous distinction between the {@code
 * AssignerWithPunctuatedWatermarks} and the {@code AssignerWithPeriodicWatermarks}.
 */
@Public
public interface WatermarkGenerator<T> {

    /**
     * Called for every event, allows the watermark generator to examine and remember the event
     * timestamps, or to emit a watermark based on the event itself.
     */
    void onEvent(T event, long eventTimestamp, WatermarkOutput output);

    /**
     * Called periodically, and might emit a new watermark, or not.
     *
     * <p>The interval in which this method is called and Watermarks are generated depends on {@link
     * ExecutionConfig#getAutoWatermarkInterval()}.
     */
    void onPeriodicEmit(WatermarkOutput output);
}
~~~

里面包含两个方法，一个是onEvent，一个是onPeriodicEmit，onEvent在每次有数据流过的时候被调用，每个元素调用一次，onPeriodicEmit周期性地被触发，默认每隔200毫秒触发一次，这个默认值可以通过`streamExecutionEnvironment.getConfig().getAutoWatermarkInterval()`得到，可以通过`streamExecutionEnvironment.getConfig().setAutoWatermarkInterval(1000L)`修改。

有了这个生成器接口的逻辑，我们再回到`BoundedOutOfOrdernessWatermarks`,细看水印生成的细节。

`outOfOrdernessMillis`就是用户允许的数据乱序时间。

当程序第一次启动时，还没有数据流入的时候，`onPeriodicEmit`被调用，该方法作用是向数据流中emit(发射，生成)一个水印，水印值被赋值为`maxTimestamp - outOfOrdernessMillis - 1`，计算后也就是`Long.MIN_VALUE`

当有数据流过时，`onEvent`被调用，此时`maxTimestamp`被赋值为`maxTimestamp`和事件时间的最大值，`maxTimestamp`得到更新

后面`onPeriodicEmit`周期性被调用的时候，不断向流中发射水印，水印也就一直被生成和更新。

**如果没有新的数据流入，那么水印就会一直保持相同值。**



## 解决窗口不计算问题

回到最开始的那个问题，如果数据流中只有一个元素，新的水印不能生成和更新，窗口也就不能触发计算。

那么，如果想要同样触发窗口计算，就需要让新的水印继续生成和更新。这就需要自定义水印生成器了。

## 自定义WatermarkGenerator

**为了解决上述问题，核心思路就是让没有新的数据到来的时候，水印也能继续更新和生成。**

### 自定义

下面这个类是一个自定义的水印生成器，允许一定时间的乱序，并且可以指定一定的等待时间，如果等待时间到达后仍然没有新的数据到来，就会更新水印。该代码改编自前文提到的`BoundedOutOfOrdernessWatermarks`。

**大致逻辑是，每次有数据到来时，将当前数据对应的事件时间作为上一次的逻辑处理时间(`currentLogicalEventTimeMills`)，每次`onPeriodicEmit`调用时，给上一次的逻辑处理时间加上固定时间间隔，该时间间隔也就是`onPeriodicEmit`的调用间隔时间，如果一直没有新的数据到来，那么`currentLogicalEventTimeMills`就会偏离上一次事件时间(`lastEventTimestamp`)越来越大，直到差值超过允许等待的时间，就触发更新水印。**

~~~java

/**
 * A watermark generator for generating watermarks. This class is modified from {@link BoundedOutOfOrdernessWatermarks}.
 */
public class BoundedOutOfOrdernessWatermarkBasedOnEventTime implements WatermarkGenerator<String> {
    /**
     * The maximum timestamp encountered so far.
     */
    private long maxTimestamp;

    /**
     * The maximum out-of-orderness that this watermark generator assumes.
     */
    private final long outOfOrdernessMillis;

    /**
     * Processing time of last event
     */
    private long lastEventTimestamp;

    /**
     * Time to emit watermark if no event comes for a long time.
     * The goal is to trigger the computation of the window even when no record is coming.
     */
    private final Duration waitTimeInMillsToEmitWatermark;

    /**
     * watermark generator interval
     */
    private final long autoWatermarkInterval;

    private long currentLogicalEventTimeMills;

    /**
     * Creates a new watermark generator with the given out-of-orderness bound.
     *
     * @param maxOutOfOrderness              The bound for the out-of-orderness of the event timestamps.
     * @param waitTimeInMillsToEmitWatermark A time allow flink to wait for in case of that no next element arrives for a long time.
     *                                       When the waiting time is up and no next element arrives, the watermark will still be generated and emitted
     * @param autoWatermarkInterval          watermark generator interval
     */
    public BoundedOutOfOrdernessWatermarkBasedOnEventTime(Duration maxOutOfOrderness, Duration waitTimeInMillsToEmitWatermark, long autoWatermarkInterval) {
        this.waitTimeInMillsToEmitWatermark = waitTimeInMillsToEmitWatermark;
        this.autoWatermarkInterval = autoWatermarkInterval;
        checkNotNull(maxOutOfOrderness, "maxOutOfOrderness");
        checkArgument(!maxOutOfOrderness.isNegative(), "maxOutOfOrderness cannot be negative");

        this.outOfOrdernessMillis = maxOutOfOrderness.toMillis();

        // start so that our lowest watermark would be Long.MIN_VALUE.
        this.maxTimestamp = Long.MIN_VALUE + outOfOrdernessMillis + 1;
        this.lastEventTimestamp = Long.MIN_VALUE + outOfOrdernessMillis + 1;
        this.currentLogicalEventTimeMills = Long.MIN_VALUE + outOfOrdernessMillis + 1;
    }

    public BoundedOutOfOrdernessWatermarkBasedOnEventTime(Duration maxOutOfOrderness, Duration waitTimeInMillsToEmitWatermark) {
        this(maxOutOfOrderness, waitTimeInMillsToEmitWatermark, 200L);
    }

    /**
     * Flink will call this method when events arrive for each record.
     *
     * @param event          element in stream
     * @param eventTimestamp the time an event happened
     * @param output         An output for watermarks. The output accepts watermarks and idleness (inactivity) status
     */
    @Override
    public void onEvent(String event, long eventTimestamp, WatermarkOutput output) {
        maxTimestamp = Math.max(maxTimestamp, eventTimestamp);
        lastEventTimestamp = maxTimestamp;
        currentLogicalEventTimeMills = maxTimestamp;
    }

    /**
     * Flink will call this method once in a while, the interval is defined by {@code ExecutionConfig.setAutoWatermarkInterval(...)},
     * for example:
     * <pre>{@code env.getConfig().setAutoWatermarkInterval(400L);}
     * </pre>
     * <p>
     * If flink wait enough time, and still not get next record, so we need to emit a new watermark triggering a computation of last window.
     * If we don't do that, the computation of last window will never be triggered.
     * It is important when we want to get some status value from the last event.
     *
     * @param output An output for watermarks. The output accepts watermarks and idleness (inactivity) status
     */
    @Override
    public void onPeriodicEmit(WatermarkOutput output) {
        currentLogicalEventTimeMills = currentLogicalEventTimeMills + autoWatermarkInterval;
        if ((currentLogicalEventTimeMills - lastEventTimestamp) > waitTimeInMillsToEmitWatermark.toMillis()) {
            output.emitWatermark(new Watermark(currentLogicalEventTimeMills - outOfOrdernessMillis - 1));
            maxTimestamp = currentLogicalEventTimeMills;
        } else {
            output.emitWatermark(new Watermark(maxTimestamp - outOfOrdernessMillis - 1));
        }
    }
}
~~~

### 如何使用

~~~java
source.assignTimestampsAndWatermarks(WatermarkStrategy
                //自定义watermark,这里必须用lambada表达式，否则会报watermarkStrategy不能序列化
                .<String>forGenerator((WatermarkGeneratorSupplier<String>) context -> new BoundedOutOfOrdernessWatermarkBasedOnEventTime(Duration.ofSeconds(5), Duration.ofSeconds(60), autoWatermarkInterval))
                //.forGenerator(new WatermarkGeneratorSupplier<String>() {
                //    @Override
                //    public WatermarkGenerator<String> createWatermarkGenerator(Context context) {
                //        return new BoundedOutOfOrdernessWatermarkBasedOnEventTime(Duration.ofSeconds(1), Duration.ofSeconds(100), autoWatermarkInterval);
                //    }
                //})
                //.<String>forBoundedOutOfOrderness(Duration.ofSeconds(2))
                .withTimestampAssigner(new SerializableTimestampAssigner<String>() {
                    @Override
                    public long extractTimestamp(String element, long recordTimestamp) {
                        if (element != null) {
                            return JSONObject.parseObject(element).getLong("timestamp") * 1000;
                        }
                        return recordTimestamp;
                    }
                })
        );
~~~

## 处理空闲Source

一个实际问题，如果Flink消费kafka的数据，kafka的topic中包含三个partition，flink创建3个consumer线程去消费，由于存在数据倾斜问题，导致topic的3个partition中，存在至少一个partition长时间没有新的数据，就会导致一个consumer thread一直处于空闲状态，这就称为空闲输入源，该consumer thread对应的watermark也就会一直**停滞不前**。

由于水印对齐机制，flink会从并行的task中取最小的watermark作为实际的watermark，这就会导致计算出现问题，比如窗口无法触发计算。

为了解决这个问题，flink提供了一个方法来检测空闲输入源，允许等待一定的时间，如果时间到达后，仍然没有新数据到来，就会忽略该task的任务。

使用方法:

~~~java
WatermarkStrategy
        .<Tuple2<Long, String>>forBoundedOutOfOrderness(Duration.ofSeconds(20))
        .withIdleness(Duration.ofMinutes(1));
~~~



### 一探究竟

我们来看看这个`withIdleness`究竟做了什么，戳进去源码看一看。

`withIdleness`是`WatermarkStrategy`的一个方法，在内部又创建了一个`WatermarkStrategyWithIdleness`，并传入了`WatermarkStrategy`自己，

~~~java

    /**
     * Creates a new enriched {@link WatermarkStrategy} that also does idleness detection in the
     * created {@link WatermarkGenerator}.
     *
     * <p>Add an idle timeout to the watermark strategy. If no records flow in a partition of a
     * stream for that amount of time, then that partition is considered "idle" and will not hold
     * back the progress of watermarks in downstream operators.
     *
     * <p>Idleness can be important if some partitions have little data and might not have events
     * during some periods. Without idleness, these streams can stall the overall event time
     * progress of the application.
     */
    default WatermarkStrategy<T> withIdleness(Duration idleTimeout) {
        checkNotNull(idleTimeout, "idleTimeout");
        checkArgument(
                !(idleTimeout.isZero() || idleTimeout.isNegative()),
                "idleTimeout must be greater than zero");
        return new WatermarkStrategyWithIdleness<>(this, idleTimeout);
    }
~~~



在`WatermarkStrategyWithIdleness`内部，时间分配器复用`WatermarkStrategy`的，水印生成器也复用了`WatermarkStrategy`的，不同的是在`createWatermarkGenerator`内部，创建了`WatermarksWithIdleness`

~~~java
/** A {@link WatermarkStrategy} that adds idleness detection on top of the wrapped strategy. */
final class WatermarkStrategyWithIdleness<T> implements WatermarkStrategy<T> {

    private static final long serialVersionUID = 1L;

    private final WatermarkStrategy<T> baseStrategy;
    private final Duration idlenessTimeout;

    WatermarkStrategyWithIdleness(WatermarkStrategy<T> baseStrategy, Duration idlenessTimeout) {
        this.baseStrategy = baseStrategy;
        this.idlenessTimeout = idlenessTimeout;
    }

    @Override
    public TimestampAssigner<T> createTimestampAssigner(TimestampAssignerSupplier.Context context) {
        return baseStrategy.createTimestampAssigner(context);
    }

    @Override
    public WatermarkGenerator<T> createWatermarkGenerator(
            WatermarkGeneratorSupplier.Context context) {
        return new WatermarksWithIdleness<>(
                baseStrategy.createWatermarkGenerator(context), idlenessTimeout);
    }
}
~~~

点进`WatermarksWithIdleness`去看看，发现它继承了`WatermarkGenerator`，说明它本质也是一个水印生成器，

1、`onEvent`调用了前面的`WatermarkStrategy`的，并且启动了一个空闲计时器`idlenessTimer`

2、`onPeriodicEmit`部分大有不同，如果检测到空闲了，就将该output标记为空闲源，下游计算就不会等待该output，否则，继续周期性地生成新的watermark

~~~java
@Public
public class WatermarksWithIdleness<T> implements WatermarkGenerator<T> {

    private final WatermarkGenerator<T> watermarks;

    private final IdlenessTimer idlenessTimer;

    /**
     * Creates a new WatermarksWithIdleness generator to the given generator idleness detection with
     * the given timeout.
     *
     * @param watermarks The original watermark generator.
     * @param idleTimeout The timeout for the idleness detection.
     */
    public WatermarksWithIdleness(WatermarkGenerator<T> watermarks, Duration idleTimeout) {
        this(watermarks, idleTimeout, SystemClock.getInstance());
    }

    @VisibleForTesting
    WatermarksWithIdleness(WatermarkGenerator<T> watermarks, Duration idleTimeout, Clock clock) {
        checkNotNull(idleTimeout, "idleTimeout");
        checkArgument(
                !(idleTimeout.isZero() || idleTimeout.isNegative()),
                "idleTimeout must be greater than zero");
        this.watermarks = checkNotNull(watermarks, "watermarks");
        this.idlenessTimer = new IdlenessTimer(clock, idleTimeout);
    }

    @Override
    public void onEvent(T event, long eventTimestamp, WatermarkOutput output) {
        watermarks.onEvent(event, eventTimestamp, output);
        idlenessTimer.activity();
    }

    @Override
    public void onPeriodicEmit(WatermarkOutput output) {
        if (idlenessTimer.checkIfIdle()) {
            output.markIdle();
        } else {
            watermarks.onPeriodicEmit(output);
        }
    }
}
~~~

## 注意

如果为水印策略指定了`withIdleness(Duration idleTimeout) `，上面说到的解决办法就要注意了，如果确实存在了空闲源，那么`onPeriodicEmit`的实际调用次数就是`idleTimeout`与`autoWatermarkInterval`的比值, 

因为:

~~~java
    @Override
    public void onPeriodicEmit(WatermarkOutput output) {
        if (idlenessTimer.checkIfIdle()) {
            output.markIdle();
        } else {
            watermarks.onPeriodicEmit(output);
        }
    }
~~~

`onPeriodicEmit`是每隔`autoWatermarkInterval`调用一次，当源空闲的时候，就不会再被周期调用。



在这个时候，上述自定义的watermark生成器的`waitTimeInMillsToEmitWatermark`参数就需要考究了，它**不能大于实际的窗口时长**。

## 总结

1、自定义水位线生成器可以解决源端无后续输入导致的窗口不触发问题，该问题生产环境中一般很少遇到。

2、空闲源产生的时候，流中就不会再继续产生新的watermark，如果其他partition有新数据，他们的watermark会继续更新。但是下游在watermark对齐的时候，就会忽略空闲源的。



如果错误，欢迎指正！