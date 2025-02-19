import { State } from '@pixi/core';
import { Point, Polygon } from '@pixi/math';
import { BLEND_MODES, DRAW_MODES } from '@pixi/constants';
import { Container } from '@pixi/display';
import { settings } from '@pixi/settings';
import MeshBatchUvs from './MeshBatchUvs';

const tempPoint = new Point();
const tempPolygon = new Polygon();

/**
 * Base mesh class.
 *
 * This class empowers you to have maximum flexibility to render any kind of WebGL visuals you can think of.
 * This class assumes a certain level of WebGL knowledge.
 * If you know a bit this should abstract enough away to make you life easier!
 *
 * Pretty much ALL WebGL can be broken down into the following:
 * - Geometry - The structure and data for the mesh. This can include anything from positions, uvs, normals, colors etc..
 * - Shader - This is the shader that PixiJS will render the geometry with (attributes in the shader must match the geometry)
 * - State - This is the state of WebGL required to render the mesh.
 *
 * Through a combination of the above elements you can render anything you want, 2D or 3D!
 *
 * @class
 * @extends PIXI.Container
 * @memberof PIXI
 */
export default class Mesh extends Container
{
    /**
     * @param {PIXI.Geometry} geometry  the geometry the mesh will use
     * @param {PIXI.Shader|PIXI.MeshMaterial} shader  the shader the mesh will use
     * @param {PIXI.State} [state] the state that the WebGL context is required to be in to render the mesh
     *        if no state is provided, uses {@link PIXI.State.for2d} to create a 2D state for PixiJS.
     * @param {number} [drawMode=PIXI.DRAW_MODES.TRIANGLES] the drawMode, can be any of the PIXI.DRAW_MODES consts
     */
    constructor(geometry, shader, state, drawMode = DRAW_MODES.TRIANGLES)// vertices, uvs, indices, drawMode)
    {
        super();

        /**
         * Includes vertex positions, face indices, normals, colors, UVs, and
         * custom attributes within buffers, reducing the cost of passing all
         * this data to the GPU. Can be shared between multiple Mesh objects.
         * @member {PIXI.Geometry}
         * @readonly
         */
        this.geometry = geometry;

        geometry.refCount++;

        /**
         * Represents the vertex and fragment shaders that processes the geometry and runs on the GPU.
         * Can be shared between multiple Mesh objects.
         * @member {PIXI.Shader|PIXI.MeshMaterial}
         */
        this.shader = shader;

        /**
         * Represents the WebGL state the Mesh required to render, excludes shader and geometry. E.g.,
         * blend mode, culling, depth testing, direction of rendering triangles, backface, etc.
         * @member {PIXI.State}
         */
        this.state = state || State.for2d();

        /**
         * The way the Mesh should be drawn, can be any of the {@link PIXI.DRAW_MODES} constants.
         *
         * @member {number}
         * @see PIXI.DRAW_MODES
         */
        this.drawMode = drawMode;

        /**
         * Typically the index of the IndexBuffer where to start drawing.
         * @member {number}
         * @default 0
         */
        this.start = 0;

        /**
         * How much of the geometry to draw, by default `0` renders everything.
         * @member {number}
         * @default 0
         */
        this.size = 0;

        /**
         * thease are used as easy access for batching
         * @member {Float32Array}
         * @private
         */
        this.uvs = null;

        /**
         * thease are used as easy access for batching
         * @member {Uint16Array}
         * @private
         */
        this.indices = null;

        /**
         * this is the caching layer used by the batcher
         * @member {Float32Array}
         * @private
         */
        this.vertexData = new Float32Array(1);

        /**
         * If geometry is changed used to decide to re-transform
         * the vertexData.
         * @member {number}
         * @private
         */
        this.vertexDirty = 0;

        this._transformID = -1;

        // Inherited from DisplayMode, set defaults
        this.tint = 0xFFFFFF;
        this.blendMode = BLEND_MODES.NORMAL;

        /**
         * Internal roundPixels field
         *
         * @member {boolean}
         * @private
         */
        this._roundPixels = settings.ROUND_PIXELS;

        /**
         * Batched UV's are cached for atlas textures
         * @member {PIXI.MeshBatchUvs}
         * @private
         */
        this.batchUvs = null;
    }

    /**
     * To change mesh uv's, change its uvBuffer data and increment its _updateID.
     * @member {PIXI.Buffer}
     * @readonly
     */
    get uvBuffer()
    {
        return this.geometry.buffers[1];
    }

    /**
     * To change mesh vertices, change its uvBuffer data and increment its _updateID.
     * Incrementing _updateID is optional because most of Mesh objects do it anyway.
     * @member {PIXI.Buffer}
     * @readonly
     */
    get verticesBuffer()
    {
        return this.geometry.buffers[0];
    }

    /**
     * Alias for {@link PIXI.Mesh#shader}.
     * @member {PIXI.Shader|PIXI.MeshMaterial}
     */
    set material(value)
    {
        this.shader = value;
    }

    get material()
    {
        return this.shader;
    }

    /**
     * The blend mode to be applied to the Mesh. Apply a value of
     * `PIXI.BLEND_MODES.NORMAL` to reset the blend mode.
     *
     * @member {number}
     * @default PIXI.BLEND_MODES.NORMAL;
     * @see PIXI.BLEND_MODES
     */
    set blendMode(value)
    {
        this.state.blendMode = value;
    }

    get blendMode()
    {
        return this.state.blendMode;
    }

    /**
     * If true PixiJS will Math.floor() x/y values when rendering, stopping pixel interpolation.
     * Advantages can include sharper image quality (like text) and faster rendering on canvas.
     * The main disadvantage is movement of objects may appear less smooth.
     * To set the global default, change {@link PIXI.settings.ROUND_PIXELS}
     *
     * @member {boolean}
     * @default false
     */
    set roundPixels(value)
    {
        if (this._roundPixels !== value)
        {
            this._transformID = -1;
        }
        this._roundPixels = value;
    }

    get roundPixels()
    {
        return this._roundPixels;
    }

    /**
     * The multiply tint applied to the Mesh. This is a hex value. A value of
     * `0xFFFFFF` will remove any tint effect.
     *
     * @member {number}
     * @default 0xFFFFFF
     */
    get tint()
    {
        return this.shader.tint;
    }

    set tint(value)
    {
        this.shader.tint = value;
    }

    /**
     * The texture that the Mesh uses.
     *
     * @member {PIXI.Texture}
     */
    get texture()
    {
        return this.shader.texture;
    }

    set texture(value)
    {
        this.shader.texture = value;
    }

    /**
     * Standard renderer draw.
     * @protected
     */
    _render(renderer)
    {
        // set properties for batching..
        // TODO could use a different way to grab verts?
        const vertices = this.geometry.buffers[0].data;

        // TODO benchmark check for attribute size..
        if (this.shader.batchable && this.drawMode === DRAW_MODES.TRIANGLES && vertices.length < Mesh.BATCHABLE_SIZE * 2)
        {
            this._renderToBatch(renderer);
        }
        else
        {
            this._renderDefault(renderer);
        }
    }

    /**
     * Standard non-batching way of rendering.
     * @protected
     * @param {PIXI.Renderer} renderer - Instance to renderer.
     */
    _renderDefault(renderer)
    {
        const shader = this.shader;

        shader.alpha = this.worldAlpha;
        if (shader.update)
        {
            shader.update();
        }

        renderer.batch.flush();

        if (shader.program.uniformData.translationMatrix)
        {
            shader.uniforms.translationMatrix = this.transform.worldTransform.toArray(true);
        }

        // bind and sync uniforms..
        renderer.shader.bind(shader);

        // set state..
        renderer.state.set(this.state);

        // bind the geometry...
        renderer.geometry.bind(this.geometry, shader);

        // then render it
        renderer.geometry.draw(this.drawMode, this.size, this.start, this.geometry.instanceCount);
    }

    /**
     * Rendering by using the Batch system.
     * @protected
     * @param {PIXI.Renderer} renderer - Instance to renderer.
     */
    _renderToBatch(renderer)
    {
        const geometry = this.geometry;

        if (this.shader.uvMatrix)
        {
            this.shader.uvMatrix.update();
            this.calculateUvs();
        }

        // set properties for batching..
        this.calculateVertices();
        this.indices = geometry.indexBuffer.data;
        this._tintRGB = this.shader._tintRGB;
        this._texture = this.shader.texture;

        const pluginName = this.material.pluginName;

        renderer.batch.setObjectRenderer(renderer.plugins[pluginName]);
        renderer.plugins[pluginName].render(this);
    }

    /**
     * Updates vertexData field based on transform and vertices
     */
    calculateVertices()
    {
        const geometry = this.geometry;
        const vertices = geometry.buffers[0].data;

        if (geometry.vertexDirtyId === this.vertexDirty && this._transformID === this.transform._worldID)
        {
            return;
        }

        this._transformID = this.transform._worldID;

        if (this.vertexData.length !== vertices.length)
        {
            this.vertexData = new Float32Array(vertices.length);
        }

        const wt = this.transform.worldTransform;
        const a = wt.a;
        const b = wt.b;
        const c = wt.c;
        const d = wt.d;
        const tx = wt.tx;
        const ty = wt.ty;

        const vertexData = this.vertexData;

        for (let i = 0; i < vertexData.length / 2; i++)
        {
            const x = vertices[(i * 2)];
            const y = vertices[(i * 2) + 1];

            vertexData[(i * 2)] = (a * x) + (c * y) + tx;
            vertexData[(i * 2) + 1] = (b * x) + (d * y) + ty;
        }

        if (this._roundPixels)
        {
            for (let i = 0; i < vertexData.length; i++)
            {
                vertexData[i] = Math.round(vertexData[i]);
            }
        }

        this.vertexDirty = geometry.vertexDirtyId;
    }

    /**
     * Updates uv field based on from geometry uv's or batchUvs
     */
    calculateUvs()
    {
        const geomUvs = this.geometry.buffers[1];

        if (!this.shader.uvMatrix.isSimple)
        {
            if (!this.batchUvs)
            {
                this.batchUvs = new MeshBatchUvs(geomUvs, this.shader.uvMatrix);
            }
            this.batchUvs.update();
            this.uvs = this.batchUvs.data;
        }
        else
        {
            this.uvs = geomUvs.data;
        }
    }

    /**
     * Updates the bounds of the mesh as a rectangle. The bounds calculation takes the worldTransform into account.
     * there must be a aVertexPosition attribute present in the geometry for bounds to be calculated correctly.
     *
     * @protected
     */
    _calculateBounds()
    {
        this.calculateVertices();

        this._bounds.addVertexData(this.vertexData, 0, this.vertexData.length);
    }

    /**
     * Tests if a point is inside this mesh. Works only for PIXI.DRAW_MODES.TRIANGLES.
     *
     * @param {PIXI.Point} point the point to test
     * @return {boolean} the result of the test
     */
    containsPoint(point)
    {
        if (!this.getBounds().contains(point.x, point.y))
        {
            return false;
        }

        this.worldTransform.applyInverse(point, tempPoint);

        const vertices = this.geometry.getBuffer('aVertexPosition').data;

        const points = tempPolygon.points;
        const indices =  this.geometry.getIndex().data;
        const len = indices.length;
        const step = this.drawMode === 4 ? 3 : 1;

        for (let i = 0; i + 2 < len; i += step)
        {
            const ind0 = indices[i] * 2;
            const ind1 = indices[i + 1] * 2;
            const ind2 = indices[i + 2] * 2;

            points[0] = vertices[ind0];
            points[1] = vertices[ind0 + 1];
            points[2] = vertices[ind1];
            points[3] = vertices[ind1 + 1];
            points[4] = vertices[ind2];
            points[5] = vertices[ind2 + 1];

            if (tempPolygon.contains(tempPoint.x, tempPoint.y))
            {
                return true;
            }
        }

        return false;
    }
    /**
     * Destroys the Mesh object.
     *
     * @param {object|boolean} [options] - Options parameter. A boolean will act as if all
     *  options have been set to that value
     * @param {boolean} [options.children=false] - if set to true, all the children will have
     *  their destroy method called as well. 'options' will be passed on to those calls.
     */
    destroy(options)
    {
        super.destroy(options);

        this.geometry.refCount--;
        if (this.geometry.refCount === 0)
        {
            this.geometry.dispose();
        }

        this.geometry = null;
        this.shader = null;
        this.state = null;
        this.uvs = null;
        this.indices = null;
        this.vertexData = null;
    }
}

/**
 * The maximum number of vertices to consider batchable. Generally, the complexity
 * of the geometry.
 * @memberof PIXI.Mesh
 * @static
 * @member {number} BATCHABLE_SIZE
 */
Mesh.BATCHABLE_SIZE = 100;
