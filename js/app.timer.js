Ext.data.ProxyMgr.registerType("timersproxy",
    Ext.extend(Ext.data.Proxy, {
        read: function(operation, callback, scope) {
            var thisProxy = this;
            var timers = [];
            var timers_config = [
                {
                    id: '0030',
                    timestamp: 0
                },
                {
                    id: '0535',
                    timestamp: 300
                },
                {
                    id: '1545',
                    timestamp: 900
                },
                {
                    id: '2050',
                    timestamp: 1200
                }
            ];
            for (var i = 0; i < timers_config.length; i++) {
                timers.push(new thisProxy.model(timers_config[i]));
            }
            operation.resultSet = new Ext.data.ResultSet({
                records : timers,
                total  : timers.length,
                loaded : true
            });
            //announce success
            operation.setSuccessful();
            operation.setCompleted();
            //finish with callback
            if (typeof callback == "function") {
                callback.call(scope || thisProxy, operation);
            }
        }
    })
);

app.models.Timer = Ext.regModel("app.models.Timer", {

    fields: [
        {name: "id", type: "string"},
        {name: "timestamp", type: "int"},
    ],

    proxy: {
        type: "timersproxy"
    },

    events: {
        "update" : true,
    },

    start: function() {
       this.run(this);
    },
    stop: function() {
        clearTimeout(this.timeout);
        this.clearListeners();
    },

    run: function(timer) {
        timer.updateState();
        timer.fireEvent("update");
        timer.timeout = setTimeout(function(){timer.run(timer)}, 500);
    },

    updateState: function() {
        this.fs = 1500; // focus length in seconds
        this.rs = 300; // relax length in seconds
        this.cs = this.fs + this.rs; // cycle length in seconds
        this.t =  Math.floor((new Date()).getTime() / 1000 - this.data.timestamp); // time in seconds since timer creation
        this.c = Math.ceil(this.t / this.cs); // cycle number
        this.ct = this.t % this.cs; // time in seconds since cycle start
        this.po = this.p;
        this.p = (this.ct > this.fs) ? 'relax' : 'focus'; // phase id
        this.pt = (this.p == 'relax') ? this.ct - this.fs : this.ct; // time in seconds since phase begin
        this.ptr = (this.p == 'relax') ? this.rs - this.pt : this.fs - this.pt; // time in seconds since phase begin
    }

});

app.stores.timers = new Ext.data.Store({
    model: "app.models.Timer"
});

app.views.TimersList = Ext.extend(Ext.Panel, {
    dockedItems: [{
        xtype: 'toolbar',
        title: 'Pomodoro EverTimers'
    }],
    layout: 'fit',
    items: [{
        xtype: 'list',
        store: app.stores.timers,
        itemTpl: '{id}',
        onItemDisclosure: function (timer) {
            Ext.dispatch({
                controller: app.controllers.timers,
                action: 'show',
                id: timer.getId()
            });
        }
    }],
    initComponent: function() {
        app.stores.timers.load();
        app.views.TimersList.superclass.initComponent.apply(this, arguments);
    }
});

app.views.TimerDetail = Ext.extend(Ext.Panel, {
    id: "timer-detail",
    dockedItems: [{
        xtype: 'toolbar',
        title: 'Timer',
        items: [
            {
                text: 'Back',
                ui: 'back',
                listeners: {
                    'tap': function () {
                        Ext.dispatch({
                            controller: app.controllers.timers,
                            action: 'index',
                            animation: {type:'slide', direction:'right'}
                        });
                    }
                }
            },
            {
                text: 'Sound is OFF',
                ui: 'action',
                listeners: {
                    'tap': function () {
                        this.setText(app.views.TimerDetail.playSound ? 'Sound is OFF' : 'Sound is ON');
                        Ext.dispatch({
                            controller: app.controllers.timers,
                            action: 'toggleSound'
                        });
                    }
                }
            },
        ]
    }],
    styleHtmlContent:true,
    scroll: 'vertical',
    items: [
        {
            id: "time",
        },
        {
            id: "phase",
        },
        {
            id: "sound",
        }
    ],
    playSound: false,
    updateWithTimer: function(timer) {
        var that = this;
        // unbind old timer
        if (this.timer !== undefined) {
            this.timer.stop();
        }
        // bind to new timer
        this.timer = timer;
        this.timer.on("update", function(){
            that.onTimerUpdate();
        });
        timer.start();
        // update toolbar
        var toolbar = this.getDockedItems()[0];
        toolbar.setTitle(this.timer.get('id'));
    },
    onTimerUpdate: function() {
        var d2 = function(n) {
            return isNaN(n) ? '--' : ((n < 10) ? '0' + n : n);
        }
        var displayTime = function(t) {
            var m = Math.floor(t / 60);
            var s = t % 60;
            return d2(m) + ':' + d2(s);
        }
        var t = this.timer;
        // update display
        this.down("#time").update(displayTime(t.ptr));
        this.down("#phase").update(t.p);
        // update doc title
        document.title = displayTime(t.ptr) + ' | ' + t.p;
        // update styling
        this.addCls(t.p);
        // in case of phase change ...
        if(t.po != t.p && t.pt < 3) {
            this.removeCls('focus');
            this.removeCls('relax');
            this.addCls(t.p);
            this.addCls('blink');
            if (app.views.TimerDetail.playSound) {
                var sound = 'media/' + t.p;
                this.down("#sound").update("<audio autoplay='autoplay' hidden='true'>"
                + "<source src='" + sound + ".mp3' type='audio/mpeg'/>"
                + "<source src='" + sound + ".ogg' type='audio/ogg'/>"
                + "<source src='" + sound + ".wav' type='audio/x-wav'/>"
                + "<source src='" + sound + ".m4a' type='audio/mp4a-latm'/>"
                + "</audio>");
            }
        }
       if (t.pt > 5) {
            this.down("#sound").update("");
            this.removeCls("blink");
        }
    }
});

app.controllers.timers = new Ext.Controller({
    index: function(options) {
        app.views.viewport.setActiveItem(
            app.views.contactsList, options.animation
        );
    },
    show: function(options) {
        var id = options.id,
            timer = app.stores.timers.getById(id);
        if (timer) {
            app.views.timerDetail.updateWithTimer(timer);
            app.views.viewport.setActiveItem(
                app.views.timerDetail, options.animation
            );
        }
    },
    toggleSound: function(options) {
       app.views.TimerDetail.playSound = !app.views.TimerDetail.playSound;
    },
});
