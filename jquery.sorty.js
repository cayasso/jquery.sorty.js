/*!
 * Sorty - v0.1.0
 *
 * https://github.com/cayasso/atomy
 * Copyright (c) 2012 Jonathan Brumley <cayasso@gmail.com>
 * Dual licensed under the MIT and GPL licenses.
 * Credits: Jonathan Brumley, Brian Gonzalez (jquery.pep.js)
 * Dependencies: jquery 1.7+ && jquery.pep.js
 */
;(function ($) {
    
    /**
     * Sorty is a lighweight jQuery plugin that enable a group of DOM
     * elements to be sortable via drag an drop on mobile and desktop devices.
     *
     * Sorty was build out of a need for easy supporting
     * drag-sorting on mobile devices with touch events without having to depend
     * on huge libraries out there. Evendo Sorty was intented for mobile devices
     * it also supports ordinery desktop browsers so feel free to use it for anything.
     *
     * This plugin was build on top of the awesome new and lightweight
     * jquery.pep.js plugin by Brian Gonzalez (https://github.com/briangonzalez/pep.jquery.js)
     *
     */

     /**
     * @param  {Object} options
     * @return {Object}
     */
    $.fn.sorty = function (options) {
        return (this.length) ? new Sorty(this, options) : this;
    };

    var Sorty = function (el, options) {

        var dummyFn = function () {},

            // Plugin defaults
            defaults = {

                /**
                 * Opacity of the dragging object
                 * @type {Number}
                 */
                opacity: 0.75,

                /**
                 * zIndex of the draggind object
                 * @type {Number}
                 */
                zIndex: 1000,

                /**
                 * The axis to use for drag-sorting
                 * @type {String}
                 */
                axis: 'y',

                /**
                 * The dragging object active class
                 * @type {String}
                 */
                activeClass :'dragging',

                /**
                 * The place holder class
                 * @type {String}
                 */
                placeholderClass: 'placeholder',

                // TO DO
                //nonSortableClass: 'non-sortable',
                //nonDraggableClass: 'non-draggable',
                //handlerClass: 'handler',
                
                /**
                 * for enableling easing effect TO DO
                 * @type {Boolean}
                 */
                enableEasing: false,

                /**
                 * Enable debug mode
                 * @type {Boolean}
                 */
                debug: false,

                /**
                 * On drag start event
                 * @type {Function}
                 */
                start: dummyFn,

                /**
                 * On drag event
                 * @type {Function}
                 */
                drag: dummyFn,

                /**
                 * On drag stop event
                 * @type {Function}
                 */
                stop: dummyFn,

                /**
                 * On sorted event
                 * @type {Function}
                 */
                sort: dummyFn
            },

            // Global declarations
            $this = $(el),

            $childs = $this.children(),

            length = $childs.length,

            tag = $childs[0].tagName,

            items = [],

            $holder = null,

            pep = null,

            index = null,

            isListSet = false,

            enableDrag = false,

            o = $.extend({}, defaults, options);

        /**
         * Cancel the sortable event
         *
         * @return {Object}
         */
        this.cancel = function () {
            $.pep.stopAll();
            return this;
        };

        /**
         * Restart the sortable event after a using the
         * cancel method.
         *
         * @return {Object}
         */
        this.resume = function () {
            $.pep.startAll();
            return this;
        };

        /**
         * Serializes the sortable's item id's
         * into an array of string.
         *
         * @return {Array}
         */
        this.toArray = function () {
            var result = [];
            $this.children().each(function () {
                result.push($(this).html());
            });
            return result;
        };

        /**
         * Get a list of child elements that are
         * sortable.
         *
         * @return {Object}
         */
        this.items = function () {
            return $this.chidren();
        };

        /**
         * Attach the api to element data.
         *
         * @return {Undefined}
         */
        function api () {
            $(el).data('sorty', obj);
        }

        /**
         * Some global declaartions
         */
        var obj = this,
            item, len, bottom, left, top, right, i, dir, isDown,
            isUp, isRight, isLeft, $el, pos, yDir, xDir, timer;


        /**
         * Set the list of elements with important properties
         * for later use.
         *
         * @return {Array}
         */
        function setList () {

            items = [];

            // fill snap elements
            $this.children().each(function (i, el) {

                // Push propsto items
                items.push({
                    height: $el.height(),
                    width: $el.width(),
                    $el: $(el)
                });
            });

            return items;
        }

        /**
         * Initialization method
         *
         * @param  {Object} e   the event
         * @param  {Object} obj the pep object
         * @return {Undefined}
         */
        function initialize (e, obj) {

            var $el = $(obj.el);

            o.start(e, getProps(obj));

            if ($el.css('position') !== 'absolute') {

                if (!isListSet) {

                    // set the list of childs
                    setList();

                    // snap elements created
                    isListSet = true;
                }

                // Create a temporary and cachable item
                !$holder && ($holder = $('<'+ tag +' />')
                    .addClass(o.placeholderClass)
                    .css({ visibility: 'hidden', position: 'relative' }));

                // Set height and width
                $holder.css({ 'height': $el.height(), 'width': $el.width() });

                //Set the zIndex
                $el.css('zIndex', o.zIndex);
            }
        }

        /**
         * This is the main drag handler
         *
         * @param  {Object} e   the event
         * @param  {Object} obj the pep object
         * @return {Undefined}
         */
        function drag (e, obj) {

            e.preventDefault();

            initialize(e, obj);

            // Set properties
            var p = getProps(obj);

            // Add the active class
            p.$el.addClass(o.activeClass).css('opacity', o.opacity);

            // Execute the drag callback event
            o.drag(e, p);

            // Iterate over items to check position
            for (i = 0, len = items.length; i < len; i++) {
                
                var item = items[i];

                // If y axis
                if (o.axis === 'y') {
                    top = item.$el.position().top;
                    bottom = item.height + top;
                    isDown = (p.top >= top && p.top <= bottom);
                    isUp = (p.top <= top );
                }

                // If x axis
                if (o.axis === 'x') {
                    left = item.$el.position().left;
                    right = item.width + left;
                    isRight = (p.left >= left && p.left <= right);
                    isLeft = (p.left <= left);
                }
                
                // Check active object position agains list
                if (!item.$el.hasClass(o.activeClass) && (o.axis === 'y' && isUp || isDown ) || (o.axis === 'x' && isLeft || isRight)) {
                    o.axis === 'y' && item.$el[p.yDir === 'up' ? 'before' : 'after']($holder);
                    o.axis === 'x' && item.$el[p.xDir === 'left' ? 'before' : 'after']($holder);
                    o.sort(e, p);
                    return;
                }
            }
        }

        /**
         * This method will be called when drag stops
         *
         * @param  {Object} e   the event
         * @param  {Object} obj the pep object
         * @return {Undefined}
         */
        function stop (e, obj) {
            if ($holder) {
                var $el = $(obj.el),
                    pos = $holder.position();
                $('.'+o.activeClass).removeClass(o.activeClass);
                $el.css({ position: '', top: '', left: '', zIndex: ''} );
                $holder.before($el);
                $holder.detach();
                setList();
                o.stop(e, $el[0]);
            }
        }

        /**
         * Get properties for returning to custom
         * events as argument
         *
         * @param  {Object} obj the pep object
         * @return {Object}
         */
        function getProps (obj) {
            
            var $el = $(obj.el),
                pos = $el.position();

            return {
                el: obj.el,
                $el: $el,
                offset: $el.offset(),
                yDir: obj._yDir,
                xDir: obj._xDir,
                left: pos.left,
                top: pos.top
            };
        }
        
        // Call the awesome pep lib
        // to handle drag event
        $childs.pep({
            shouldEase: o.enableEasing,
            debug: o.debug,
            boundToParent: true,
            drag: drag,
            stop: stop
        });

        // Set the api
        api();

        // Return the main object
        return el;
    };

})(jQuery);