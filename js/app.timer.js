app.models.Timer = Ext.regModel("app.models.Timer", {

    /* timer creation timestanp */
    creation: 0,

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
        timer.timeout = setTimeout(function(){timer.run(timer);}, 500);
    },

    updateState: function() {
        this.pth = 5; // phase change margin : +/- 5 secs
        this.fs = 1500; // focus length in seconds
        this.rs = 300; // relax length in seconds
        this.cs = this.fs + this.rs; // cycle length in seconds
        this.t =  Math.floor((new Date()).getTime() / 1000 - this.creation); // time in seconds since timer creation
        this.c = Math.ceil(this.t / this.cs); // cycle number
        this.ct = this.t % this.cs; // time in seconds since cycle start
        this.po = this.p;
        this.p = (this.ct > this.fs) ? 'relax' : 'focus'; // phase id
        this.pt = (this.p == 'relax') ? this.ct - this.fs : this.ct; // time in seconds since phase begin
        this.ptr = (this.p == 'relax') ? this.rs - this.pt : this.fs - this.pt; // time in seconds since phase begin
    }

});

app.views.TimerDetail = Ext.extend(Ext.Panel, {
    id: "timer-detail",
    timer: new app.models.Timer(),
    playSound: false,
    styleHtmlContent:true,
    scroll: 'vertical',
    dockedItems: [{
        xtype: 'toolbar',
        title: 'Pomodoro EverTimer',
        items: [
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
            }
        ]
    }],
    items: [
        {
            id: "time"
        },
        {
            id: "phase"
        },
        {
            id: "sound"
        }
    ],
    listeners: {
        activate: function() {
            this.onInit();
        }
    },
    onInit: function() {
        var that = this;
        this.timer.on("update", function(){
            that.onTimerUpdate();
        });
    },
    onTimerUpdate: function() {
        this.updateTitle();
        this.updateGraphic();
        this.updateSound();
    },
    updateGraphic: function() {
        var t = this.timer;
        // update display
        this.down("#phase").update(t.p);
        this.down("#time").update(this.displayTime(t.ptr));
        // update styling
        this.addCls(t.p);
        // in case of phase change ...
        if(t.po != t.p && t.pt < t.pth) {
            this.removeCls('focus');
            this.removeCls('relax');
            this.addCls(t.p);
            this.addCls('blink');
        }
       if (t.pt > t.pth) {
            this.removeCls("blink");
        }
    },
    updateTitle: function() {
        var t = this.timer;
        document.title = this.displayTime(t.ptr) + ' | ' + t.p;
    },
    updateSound: function() {
        var t = this.timer;
        // in case of phase change ...
        if(t.po != t.p && t.pt < t.pth) {
            if (app.views.TimerDetail.playSound) {
                var sound = 'media/' + t.p;
                this.down("#sound").update("<audio autoplay='autoplay' hidden='true'>"
                + "<source src='" + sound + ".mp3' type='audio/mpeg'/>"
                + "<source src='" + sound + ".ogg' type='audio/ogg'/>"
                + "<source src='" + sound + ".wav' type='audio/x-wav'/>"
                + "</audio>");
            }
        }
       if (t.pt > t.pth) {
            this.down("#sound").update("");
        }

    },
    d2: function(n) {
        return isNaN(n) ? '--' : ((n < 10) ? '0' + n : n);
    },
    displayTime: function(t) {
        var m = Math.floor(t / 60);
        var s = t % 60;
        return this.d2(m) + ':' + this.d2(s);
    }
});

app.controllers.timers = new Ext.Controller({
    toggleSound: function(options) {
       app.views.TimerDetail.playSound = !app.views.TimerDetail.playSound;
    }
});
