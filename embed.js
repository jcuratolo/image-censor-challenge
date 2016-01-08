// todo create method to handle insertion of new images
// todo create bookmarklet to load this code
(function () {
    'use strict';

    var imageCensorService;
    var imageFactory;
    var imagesOnPage;
    var imageCensorables;

    /**
     * Convenience function for testing if an option is undefined and throwing
     * an error
     * @param options
     */
    function throwIfUndef(options) {
        if (typeof options.value === 'undefined') {
            throw new Error(options.message);
        }
    }

    /**
     * Constructor for Objects with both an image and censor property
     * @param options
     * @constructor
     */
    function ImageCensorable(options) {
        this.image = options.imageElement;
    }

    function ImageFactory() {
        /**
         * Returns a boolean indicating if value is an image
         * @param value
         * @returns {boolean}
         */
        function isNotImage(value) {
            return !(value instanceof HTMLImageElement);
        }

        /**
         * Validates parameter and returns an instance of ImageCensorable with
         * the original parameter bound to the image property
         * @param imageElement
         * @returns {ImageCensorable}
         */
        function create(imageElement) {
            var options = {};

            if (typeof imageElement === 'undefined') {
                throw new Error('imageElement must be defined to create new ImageCensorable');
            }

            if (isNotImage(imageElement)) {
                throw new Error('HTMLImageElement is required to create new ImageCensorable');
            }

            options.imageElement = imageElement;

            return new ImageCensorable(options);
        }

        this.create = create;
    }

    function ImageCensorService() {
        var CENSOR_BG_COLOR = 'red';
        var CENSOR_ZINDEX = 5;
        var CENSOR_POSITION_TYPE = 'absolute';

        var config = {

            // Properties modified on censor elements only
            censorProps: [
                {name: 'backgroundColor', value: CENSOR_BG_COLOR},
                {name: 'zIndex', value: CENSOR_ZINDEX},
                {name: 'position', value: CENSOR_POSITION_TYPE}
            ],

            // Properties copied from image to censor elements
            sharedProps: [
                'x',
                'y',
                'height',
                'width'
            ]
        };


        /**
         * Creates censor elements, binds them to the censor property on each
         * image, and inserts them as a sibling of the image into the document
         * @param images
         * @returns {Array}
         */
        function populateCensors(images) {
            throwIfUndef({
                value: images,
                message: 'A collection of images is required in which to populate censors'
            });

            for (var i = 0; i < images.length; i++) {
                var currentImage = images[i];

                // is there already a censor here?
                if (typeof currentImage.censor === 'undefined') {
                    // create element
                    currentImage.censor = document.createElement('div');

                    // insert as sibling of image
                    currentImage.image.parentElement.insertBefore(currentImage.censor, currentImage.image);
                }
            }

            return images;
        }

        /**
         * Styles censors in the passed images collection to the defaults found
         * in config
         * @param images
         * @returns {Array}
         */
        function setCensorStyles(images) {
            throwIfUndef({
                value: images,
                message: 'A collection of images is required to set censor styles'
            });

            // loop through all images and set up their censors
            for (var i = 0; i < images.length; i++) {
                var censor = images[i].censor;

                // set properties defined in config
                for (var j = 0; j < config.censorProps.length; j++) {
                    var censorProp = config.censorProps[j];
                    censor.style[censorProp.name] = censorProp.value;
                }
            }

            return images;
        }

        /**
         * Positions censors ontop of their images
         * @param images
         * @returns {Array}
         */
        function setCensorPositions(images) {
            throwIfUndef({
                value: images,
                message: 'A collection of images is required to set censor positions'
            });

            for (var i = 0; i < images.length; i++) {
                var image = images[i].image;
                var censor = images[i].censor;

                // copy important properties from images to censors
                for (var j = 0; j < config.sharedProps.length; j++) {
                    var sharedProp = config.sharedProps[j];

                    // relevant position attributes are part of element styles
                    // x and y values are exceptions that correspond to left
                    // and top

                    if (sharedProp === 'x') {
                        censor.style.left = image[sharedProp] + 'px';
                    }

                    if (sharedProp === 'y') {
                        censor.style.top = image[sharedProp] + 'px';
                    }

                    censor.style[sharedProp] = image[sharedProp] + 'px';
                }
            }

            return images;
        }

        return {
            populateCensors: populateCensors,
            setCensorStyles: setCensorStyles,
            setCensorPositions: setCensorPositions
        };
    }

    /**
     * Get all images on page
     * @param imagesOnPage
     */
    function gatherImages() {
        var imagesOnPage;
        imagesOnPage = document.getElementsByTagName('img');
        return imagesOnPage;
    }

    /**
     * Clear out all censors
     */
    function deleteCensors() {
        // delete censors
        for (var i = 0; i < imageCensorables.length; i++) {
            imageCensorables[i].censor.parentNode.removeChild(imageCensorables[i].censor);
        }
    }

    /**
     * Regathers images, repopulates censors, positions and styles them.
     * @todo Diff out old images to make this more efficient
     */
    function redrawCensors() {
        // get rid of old censors
        deleteCensors();
        // regather images
        imagesOnPage = gatherImages();

        // remove reference to old collection
        imageCensorables = [];

        // create new censors
        for (var i = 0; i < imagesOnPage.length; i++) {
            imageCensorables.push(
                imageFactory.create(imagesOnPage[i])
            );
        }

        imageCensorService.populateCensors(imageCensorables);
        imageCensorService.setCensorStyles(imageCensorables);
        imageCensorService.setCensorPositions(imageCensorables);
    }

    /**
     * Used to set everything up prior to use. Instantiates the required
     * service and factory. Gathers images from the page. Instantiates
     * imageCensorables from found images.
     * @returns {boolean}
     */
    function init() {
        var validations = {};

        imagesOnPage = gatherImages();

        // Instantiate service
        imageCensorService = new ImageCensorService();

        // Instantiate factory
        imageFactory = new ImageFactory();

        // Collection of imageCensorable instances
        imageCensorables = [];

        // get instances of imageCensorables from imageFactory
        for (var i = 0; i < imagesOnPage.length; i++) {
            imageCensorables.push(
                imageFactory.create(imagesOnPage[i])
            );
        }

        imageCensorService.populateCensors(imageCensorables);
        imageCensorService.setCensorStyles(imageCensorables);
        imageCensorService.setCensorPositions(imageCensorables);

        // Lets make sure intialization went ok

        // imagesOnPage is not undefined
        validations.imagesDefined = typeof imagesOnPage !== 'undefined';

        // more than 0 images found
        validations.imagesFound = imagesOnPage.length > 0;

        // instantiated imageCensorables from found images
        for (i = 0; i < imageCensorables.length; i++) {
            if (typeof imageCensorables[i] !== 'undefined' &&
                imageCensorables[i] instanceof ImageCensorable) {
                validations.imageCensorablesCreated = true;
            } else {
                validations.imageCensorablesCreated = false;
                break;
            }
        }

        // number imageCensorable instances matches number of images found
        validations.correctNumberOfImageCensorables =
            imageCensorables.length === imagesOnPage.length;

        // check validation keys for point of failure
        for (var key in validations) {
            if (!validations[key]) {
                throw new Error('Initialization unable to complete. ' + key +
                    ' was unsuccessful.');
            }
        }
        // all good!
        return true;
    }

    init();
    // this is kind of heavy but the only way to go for max compatibility
    setInterval(redrawCensors, 1000);
    window.onresize = function () {
        imageCensorService.setCensorPositions(imageCensorables);
    };
})();
