
Ext.setup({
    tabletStartupScreen: 'tablet_startup.png',
    phoneStartupScreen: 'phone_startup.png',
    icon: 'icon.png',
    glossOnIcon: false,
    onReady: function(options) {
        Ext.define('CartModel', {
            extend: 'Ext.data.Model',
            config: {
                fields: [
                    {name: 'name', type: 'string'},
                    {name: 'price', type: 'string'},
                    {name: 'symbol', type: 'string'},
                    {name: 'image', type: 'string', defaultValue: "https://cdn1.iconfinder.com/data/icons/despicable-me-2-minions/128/despicable-me-2-Minion-icon-7.png"},
                    {name: 'count', type: 'int', defaultValue: 0},
                    { name: 'symbolprice', convert: function (v, r) {
                        return r.get('symbol') + (parseFloat(r.get('price')).toFixed(2));
                    }},
                    { name: 'subtotal', convert: function (v, r) {
                        return (parseInt(r.get("count")) * parseFloat(r.get("price"))).toFixed(2);
                    }},
                    { name: 'symbolsubtotal', convert: function (v, r) {
                        return r.get('symbol') + r.get('subtotal');
                    }}
                ]

            }
        });




        Ext.define('CartInnerItem', {
            extend: 'Ext.Panel',
            xtype: 'cartinneritem',



            config: {
                flex : 2,

                /**
                 * Object with product's data
                 */


                layout: 'hbox',
                items : [{
                    flex :  5,
                    layout : "vbox",
                    minHeight : 80,
                    items: [{
                        xtype: 'panel',
                        flex :  2,
                        itemId : 'displayname'
                    },{
                        xtype: 'panel',
                        flex :  2,
                        itemId : 'price'
                    }]
                },{
                    flex : 1,
                    cls : 'quantityspinner-cls',
                    layout : "vbox",
                    items :[{
                        itemId :"subtotal",
                        styleHtmlCls : 'subtotal-cls',
                        flex : 1
                    },{
                        flex: 1,

                        xtype : "spinnerfield",
                        stepValue: 1,// From 2.1 Beta
                        minValue: 0,
                        maxValue: 100,
                        itemId: "itemspinnerfield",
                        groupButtons: false,
                        component: {
                            disabled: false
                        }
                    }]

                }]

            },

            setDisplayName : function(name){
                this.down("#displayname").setHtml(name);
            },
            setPrice : function(price){
                this.down("#price").setHtml(price);
            },
            setSubtotal : function(subtotal){
                this.down("#subtotal").setHtml(subtotal);
            },
            setQuantity : function (count){
                this.down("#itemspinnerfield").setValue(count);
            }


        });

        // Main Cart Item
        Ext.define('CartItem', {
            extend: 'Ext.dataview.component.DataItem',
            xtype: 'cartitem',



            config: {

                layout: 'fit',
                cls : 'cartitem-cls',

                dataMap: {



                    // Map product's data to dataItem setter
                    getCartinneritem: {
                        setDisplayName: 'name',
                        setPrice: 'symbolprice',
                        setSubtotal: 'symbolsubtotal',
                        setQuantity: 'count'
                    },
                    getImage: {
                        //and then this will call: this.getImage().setSrc() with the
                        //'image' field value form the record
                        setSrc: 'image'
                    }
                },

                image: true,

                cartinneritem: {
                    flex: 2
                },

                deleteButton: {
                    iconCls: 'trash',
                    iconMask: true,
                    ui: 'plain',
                    itemId: "itemdelete"
                },


                layout: {
                    type: 'hbox',
                    align: 'center'
                }
            },
            applyCartinneritem: function(config) {
                console.log(CartInnerItem);
                return Ext.factory(config,
                    CartInnerItem,
                    this.getCartinneritem());
            },
            updateCartinneritem : function(newItemLine, oldItemLine) {
                if (oldItemLine) {

                    this.remove(oldItemLine);
                }

                if (newItemLine) {
                    newItemLine.down("#itemspinnerfield").on('change', this.updateQuantity, this);
                    // Attach lines to DataView
                    this.add(newItemLine);
                }
            },
            applyImage: function (config) {
                return Ext.factory(config, Ext.Img, this.getImage());
            },

            updateImage: function (newImage, oldImage) {
                if (newImage) {
                    this.add(newImage);
                }

                if (oldImage) {
                    this.remove(oldImage);
                }
            },
            updateQuantity: function (spinField, newValue, oldValue, eOpts) {
                var record = this.getRecord(), me = this, subtotal;
                record.set("count", newValue);
                subtotal = (record.get("count") * record.get("price")).toFixed(2);
                record.set("subtotal", subtotal);
                record.set("symbolsubtotal", record.get("symbol") + "" + subtotal);
                if (newValue == 0) {
                    Ext.Msg.confirm(null,
                        "Do you want to remove?",
                        function (answer) {

                            if (answer === 'yes') {
                                me.getDataview().getStore().remove(record);
                            }
                        });
                }
                spinField.fireEvent('quantityspin', record, spinField, newValue, this);
            },
            applyDeleteButton: function (config) {
                return Ext.factory(config, Ext.Button, this.getDeleteButton());
            },

            updateDeleteButton: function (newDeleteButton, oldDelteButton) {
                if (oldDelteButton) {
                    this.remove(oldDelteButton);
                }

                if (newDeleteButton) {
                    // add an event listeners for the `tap` event onto the new button, and tell it to call the onNameButtonTap method
                    // when it happens
                    newDeleteButton.on('tap', this.onDeleteButtonTap, this);

                    this.add(newDeleteButton);
                }
            },

            onDeleteButtonTap: function (button, e) {
                var record = this.getRecord(), me = this;

                Ext.Msg.confirm(null,
                    "Do you want to remove?",
                    function (answer) {

                        if (answer === 'yes') {
                            me.getDataview().getStore().remove(record);
                            button.fireEvent('deleteitem', this);
                        }
                    });
            }
        });


        /**
         * Cart Dataview
         */
        Ext.create('Ext.dataview.DataView', {
            flex:1,
            layout:"fit",
            fullscreen:true,
            cls : "menulistcls",
            store : {
                model: 'CartModel',
                data : [
                    {name: "Name1",    price: 32.43, symbol : "$" },
                    {name: "Name2",    price: 43, symbol : "$" },
                    {name: "Name3",    price: 12, symbol : "$" },
                    {name: "Name4",    price: 22.03, symbol : "$"},
                    {name: "Name5",    price: 23.63, symbol : "$"},
                    {name: "Name6",    price: 9.43, symbol : "$" }
                ]
            },
            itemCls : 'menuitemcls',
            emptyText: 'Your cart is empty',
            useComponents: true,
            defaultType: 'cartitem'
        });


    }
});
