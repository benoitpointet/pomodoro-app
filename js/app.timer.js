Ext.data.ProxyMgr.registerType("timersproxy",
    Ext.extend(Ext.data.Proxy, {
        read: function(operation, callback, scope) {
            var thisProxy = this;
            var timers = [];
            timers.push(new thisProxy.model({
                id: '0030',
                timestamp: 0
            }));
            timers.push(new thisProxy.model({
                id: '1545',
                timestamp: 900
            }));
            operation.resultSet = new Ext.data.ResultSet({
                records: timers,
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
        onItemDisclosure: function (record) {
            Ext.dispatch({
                controller: app.controllers.timers,
                action: 'show',
                id: record.getId()
            });
        }
    }],
    initComponent: function() {
        app.stores.timers.load();
        app.views.TimersList.superclass.initComponent.apply(this, arguments);
    }
});

app.views.TimerDetail = Ext.extend(Ext.Panel, {
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
        ]
    }],
    styleHtmlContent:true,
    scroll: 'vertical',
    items: [],
    updateWithRecord: function(record) {
        var toolbar = this.getDockedItems()[0];
        toolbar.setTitle(record.get('id'));
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
            app.views.timerDetail.updateWithRecord(timer);
            app.views.viewport.setActiveItem(
                app.views.timerDetail, options.animation
            );
        }
    },
});
