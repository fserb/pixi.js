import BaseImageResource from './BaseImageResource';

/**
 * Resource type for HTMLCanvasElement.
 * @class
 * @extends PIXI.resources.BaseImageResource
 * @memberof PIXI.resources
 * @param {HTMLCanvasElement} source - Canvas element to use
 */
export default class CanvasResource extends BaseImageResource
{
    /**
     * Used to auto-detect the type of resource.
     *
     * @static
     * @param {HTMLCanvasElement|OffscreenCanvas} source - The source object
     * @return {boolean} `true` if <canvas>
     */
    static test(source)
    {
        const { OffscreenCanvas } = window;

        // Check for browsers that don't yet support OffscreenCanvas
        if (OffscreenCanvas && source instanceof OffscreenCanvas)
        {
            return true;
        }

        return source instanceof HTMLCanvasElement;
    }
}
