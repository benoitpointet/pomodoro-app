var app = Ext.regApplication({
    name: 'app',
    launch: function() {
        this.launched = true;
        this.mainLaunch();
    },
    mainLaunch: function() {
        this.views.viewport = new this.views.Viewport();
    }
});

app.views.Viewport = Ext.extend(Ext.Panel, {
    fullscreen: true,
    layout: 'card',
    cardSwitchAnimation: 'slide',
    initComponent: function() {
        //put instances of cards into app.views namespace
        Ext.apply(app.views, {
            timerDetail: new app.views.TimerDetail()
        });
        //put instances of cards into viewport
        Ext.apply(this, {
            items: [
                app.views.timerDetail
            ]
        });
        app.views.Viewport.superclass.initComponent.apply(this, arguments);
    }
});
