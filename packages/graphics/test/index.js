// const MockPointer = require('../interaction/MockPointer');
const { Renderer, BatchRenderer } = require('@pixi/core');
const { Graphics } = require('../');
const { BLEND_MODES } = require('@pixi/constants');
const { Point } = require('@pixi/math');
const { skipHello } = require('@pixi/utils');

Renderer.registerPlugin('batch', BatchRenderer);

skipHello();

function withGL(fn)
{
    return !process.env.DISABLE_WEBGL ? (fn || true) : undefined;
}

describe('PIXI.Graphics', function ()
{
    describe('constructor', function ()
    {
        it('should set defaults', function ()
        {
            const graphics = new Graphics();

            expect(graphics.fill.color).to.be.equals(0xFFFFFF);
            expect(graphics.fill.alpha).to.be.equals(1);
            expect(graphics.line.width).to.be.equals(0);
            expect(graphics.line.color).to.be.equals(0);
            expect(graphics.tint).to.be.equals(0xFFFFFF);
            expect(graphics.blendMode).to.be.equals(BLEND_MODES.NORMAL);
        });
    });

    describe('lineTo', function ()
    {
        it('should return correct bounds - north', function ()
        {
            const graphics = new Graphics();

            graphics.lineStyle(1);
            graphics.moveTo(0, 0);
            graphics.lineTo(0, 10);

            expect(graphics.width).to.be.below(1.00001);
            expect(graphics.width).to.be.above(0.99999);
            expect(graphics.height).to.be.equals(10);
        });

        it('should return correct bounds - south', function ()
        {
            const graphics = new Graphics();

            graphics.moveTo(0, 0);
            graphics.lineStyle(1);
            graphics.lineTo(0, -10);

            expect(graphics.width).to.be.below(1.00001);
            expect(graphics.width).to.be.above(0.99999);
            expect(graphics.height).to.be.equals(10);
        });

        it('should return correct bounds - east', function ()
        {
            const graphics = new Graphics();

            graphics.moveTo(0, 0);
            graphics.lineStyle(1);
            graphics.lineTo(10, 0);

            expect(graphics.height).to.be.equals(1);
            expect(graphics.width).to.be.equals(10);
        });

        it('should return correct bounds - west', function ()
        {
            const graphics = new Graphics();

            graphics.moveTo(0, 0);
            graphics.lineStyle(1);
            graphics.lineTo(-10, 0);

            expect(graphics.height).to.be.above(0.9999);
            expect(graphics.height).to.be.below(1.0001);
            expect(graphics.width).to.be.equals(10);
        });

        it('should return correct bounds when stacked with circle', function ()
        {
            const graphics = new Graphics();

            graphics.beginFill(0xFF0000);
            graphics.drawCircle(50, 50, 50);
            graphics.endFill();

            expect(graphics.width).to.be.equals(100);
            expect(graphics.height).to.be.equals(100);

            graphics.lineStyle(20, 0);
            graphics.moveTo(25, 50);
            graphics.lineTo(75, 50);

            expect(graphics.width).to.be.equals(100);
            expect(graphics.height).to.be.equals(100);
        });

        it('should return correct bounds when square', function ()
        {
            const graphics = new Graphics();

            graphics.lineStyle(20, 0, 0.5);
            graphics.moveTo(0, 0);
            graphics.lineTo(50, 0);
            graphics.lineTo(50, 50);
            graphics.lineTo(0, 50);
            graphics.lineTo(0, 0);

            expect(graphics.width).to.be.equals(70);
            expect(graphics.height).to.be.equals(70);
        });

        it('should ignore duplicate calls', function ()
        {
            const graphics = new Graphics();

            graphics.moveTo(0, 0);
            graphics.lineTo(0, 0);
            graphics.lineTo(10, 0);
            graphics.lineTo(10, 0);

            expect(graphics.currentPath.points).to.deep.equal([0, 0, 10, 0]);
        });

        describe('lineJoin', function ()
        {
            describe('miter', function ()
            {
                it('is miter by default (backwards compatible)', function ()
                {
                    // given
                    const graphics = new PIXI.Graphics();

                    // then
                    expect(graphics.line.lineJoin).to.be.equal('miter');
                });

                it('clockwise miter', withGL(function ()
                {
                    // given
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphics = new PIXI.Graphics();

                    graphics.lineStyle(2, 0, 1, 0.5);
                    graphics.lineJoin = 'miter';

                    graphics.moveTo(0, 0);
                    graphics.lineTo(50, 0);
                    graphics.lineTo(50, 50);

                    // when
                    renderer.render(graphics);

                    // then
                    const glData = graphics._webGL[renderer.CONTEXT_UID].data[0];
                    const points = glData.points;

                    // 6 control points, xy each
                    expect(points.length / 2, 'number of control points is not right').to.be.equal(6);

                    expect(points[0], 'x1').to.be.eql(0);
                    expect(points[1], 'y1').to.be.eql(1);

                    expect(points[6], 'x2').to.be.eql(0);
                    expect(points[7], 'y2').to.be.eql(-1);

                    expect(points[12], 'x3').to.be.eql(49);
                    expect(points[13], 'y3').to.be.eql(1);

                    expect(points[18], 'x4').to.be.eql(51);
                    expect(points[19], 'y4').to.be.eql(-1);

                    expect(points[24], 'x5').to.be.eql(49);
                    expect(points[25], 'y5').to.be.eql(50);

                    expect(points[30], 'x6').to.be.eql(51);
                    expect(points[31], 'y6').to.be.eql(50);
                }));

                it('counterclockwise miter', withGL(function ()
                {
                    // given
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphics = new PIXI.Graphics();

                    graphics.lineStyle(2, 0, 1, 0.5);
                    graphics.lineJoin = 'miter';

                    graphics.moveTo(0, 0);
                    graphics.lineTo(50, 0);
                    graphics.lineTo(50, -50);

                    // when
                    renderer.render(graphics);

                    // then
                    const glData = graphics._webGL[renderer.CONTEXT_UID].data[0];
                    const points = glData.points;

                    // 6 control points, xy each
                    expect(points.length / 2, 'number of control points is not right').to.be.equal(6);

                    expect(points[0], 'x1').to.be.eql(0);
                    expect(points[1], 'y1').to.be.eql(1);

                    expect(points[6], 'x2').to.be.eql(0);
                    expect(points[7], 'y2').to.be.eql(-1);

                    expect(points[12], 'x3').to.be.eql(51);
                    expect(points[13], 'y3').to.be.eql(1);

                    expect(points[18], 'x4').to.be.eql(49);
                    expect(points[19], 'y4').to.be.eql(-1);

                    expect(points[24], 'x5').to.be.eql(51);
                    expect(points[25], 'y5').to.be.eql(-50);

                    expect(points[30], 'x6').to.be.eql(49);
                    expect(points[31], 'y6').to.be.eql(-50);
                }));

                it('flat line miter', withGL(function ()
                {
                    // given
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphics = new PIXI.Graphics();

                    graphics.lineStyle(2, 0, 1, 0.5);
                    graphics.lineJoin = 'miter';

                    graphics.moveTo(0, 0);
                    graphics.lineTo(50, 0);
                    graphics.lineTo(100, 0);

                    // when
                    renderer.render(graphics);

                    // then
                    const glData = graphics._webGL[renderer.CONTEXT_UID].data[0];
                    const points = glData.points;

                    // 6 control points, xy each
                    expect(points.length / 2, 'number of control points is not right').to.be.equal(6);

                    expect(points[0], 'x1').to.be.eql(0);
                    expect(points[1], 'y1').to.be.eql(1);

                    expect(points[6], 'x2').to.be.eql(0);
                    expect(points[7], 'y2').to.be.eql(-1);

                    expect(points[12], 'x3').to.be.eql(50);
                    expect(points[13], 'y3').to.be.eql(1);

                    expect(points[18], 'x5').to.be.eql(50);
                    expect(points[19], 'y5').to.be.eql(-1);

                    expect(points[24], 'x7').to.be.eql(100);
                    expect(points[25], 'y7').to.be.eql(1);

                    expect(points[30], 'x8').to.be.eql(100);
                    expect(points[31], 'y8').to.be.eql(-1);
                }));

                it('very sharp clockwise miter falling back to bevel', withGL(function ()
                {
                    // given
                    const p1 = [0, 0];
                    const p2 = [50, 0];
                    const p3 = [0, 2];
                    // normalized perpendicular lines
                    const perp1 = [0, 0.5];
                    const perp2 = [0.019984019174435787, 0.4996004793608947]; // [0.039968038348871575, 0.9992009587217894];
                    const anchor = [24.990003996803196, 0.5];
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphics = new PIXI.Graphics();

                    graphics.lineStyle(1, 0, 1, 0.5);
                    graphics.lineJoin = 'miter';

                    graphics.moveTo(p1[0], p1[1]);
                    graphics.lineTo(p2[0], p2[1]);

                    // when
                    graphics.lineTo(p3[0], p3[1]);
                    renderer.render(graphics);

                    // then
                    const glData = graphics._webGL[renderer.CONTEXT_UID].data[0];
                    const points = glData.points;

                    // 8 control points, xy each
                    expect(points.length / 2, 'number of control points is not right').to.be.equal(8);

                    expect(points[0], 'x1').to.be.eql(p1[0] + perp1[0]);
                    expect(points[1], 'y1').to.be.eql(p1[1] + perp1[1]);

                    expect(points[6], 'x2').to.be.eql(p1[0] - perp1[0]);
                    expect(points[7], 'y2').to.be.eql(p1[1] - perp1[1]);

                    expect(points[12], 'x3').to.be.eql(anchor[0]);
                    expect(points[13], 'y3').to.be.eql(anchor[1]);

                    expect(points[18], 'x4').to.be.eql(p2[0] - perp1[0]);
                    expect(points[19], 'y4').to.be.eql(p2[1] - perp1[1]);

                    expect(points[24], 'x5').to.be.eql(anchor[0]);
                    expect(points[25], 'y5').to.be.eql(anchor[1]);

                    expect(points[30], 'x6').to.be.eql(p2[0] + perp2[0]);
                    expect(points[31], 'y6').to.be.eql(p2[1] + perp2[1]);

                    expect(points[36], 'x7').to.be.eql(p3[0] - perp2[0]);
                    expect(points[37], 'y7').to.be.eql(p3[1] - perp2[1]);

                    expect(points[42], 'x8').to.be.eql(p3[0] + perp2[0]);
                    expect(points[43], 'y8').to.be.eql(p3[1] + perp2[1]);
                }));

                it('very sharp counterclockwise miter falling back to bevel', withGL(function ()
                {
                    // given
                    const p1 = [0, 0];
                    const p2 = [50, 0];
                    const p3 = [0, -2];
                    // normalized perpendicular vectors
                    const perp1 = [0, 0.5];
                    const perp2 = [0.019984019174435787, -0.4996004793608947];
                    const anchor = [24.990003996803196, -0.5];
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphics = new PIXI.Graphics();

                    graphics.lineStyle(1, 0, 1, 0.5);
                    graphics.lineJoin = 'miter';

                    graphics.moveTo(p1[0], p1[1]);
                    graphics.lineTo(p2[0], p2[1]);

                    // when
                    graphics.lineTo(p3[0], p3[1]);
                    renderer.render(graphics);

                    // then
                    const glData = graphics._webGL[renderer.CONTEXT_UID].data[0];
                    const points = glData.points;

                    // 8 control points, xy each
                    expect(points.length / 2, 'number of control points is not right').to.be.equal(8);

                    expect(points[0], 'x1').to.be.eql(p1[0] + perp1[0]);
                    expect(points[1], 'y1').to.be.eql(p1[1] + perp1[1]);

                    expect(points[6], 'x2').to.be.eql(p1[0] - perp1[0]);
                    expect(points[7], 'y2').to.be.eql(p1[1] - perp1[1]);

                    expect(points[12], 'x3').to.be.eql(p2[0] + perp1[0]);
                    expect(points[13], 'y3').to.be.eql(p2[1] + perp1[1]);

                    expect(points[18], 'x4').to.be.eql(anchor[0]);
                    expect(points[19], 'y4').to.be.eql(anchor[1]);

                    expect(points[24], 'x5').to.be.eql(p2[0] + perp2[0]);
                    expect(points[25], 'y5').to.be.eql(p2[1] + perp2[1]);

                    expect(points[30], 'x6').to.be.eql(anchor[0]);
                    expect(points[31], 'y6').to.be.eql(anchor[1]);

                    expect(points[36], 'x7').to.be.eql(p3[0] + perp2[0]);
                    expect(points[37], 'y7').to.be.eql(p3[1] + perp2[1]);

                    expect(points[42], 'x8').to.be.eql(p3[0] - perp2[0]);
                    expect(points[43], 'y8').to.be.eql(p3[1] - perp2[1]);
                }));

                it('miter join paralel lines', withGL(function ()
                {
                    // given
                    const p1 = [0, 0];
                    const p2 = [50, 0];
                    const p3 = [100, 0];
                    // normalized perpendicular vectors
                    const perp1 = [0, 1];
                    const perp2 = [0, -1];
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphicsMiter = new PIXI.Graphics();

                    graphicsMiter.lineStyle(2, 0, 1, 0.5);
                    graphicsMiter.lineJoin = 'miter';

                    graphicsMiter.moveTo(p1[0], p1[1]);
                    graphicsMiter.lineTo(p2[0], p2[1]);
                    graphicsMiter.lineTo(p3[0], p3[1]);

                    // when
                    renderer.render(graphicsMiter);

                    // then
                    const points = graphicsMiter._webGL[renderer.CONTEXT_UID].data[0].points;

                    // 6 control points, xy each
                    expect(points.length / 2, 'number of control points is not right').to.be.equal(6);

                    expect(points[0], 'x1').to.be.eql(p1[0] + perp1[0]);
                    expect(points[1], 'y1').to.be.eql(p1[1] + perp1[1]);

                    expect(points[6], 'x2').to.be.eql(p1[0] - perp1[0]);
                    expect(points[7], 'y2').to.be.eql(p1[1] - perp1[1]);

                    expect(points[12], 'x3').to.be.eql(p2[0] + perp1[0]);
                    expect(points[13], 'y3').to.be.eql(p2[1] + perp1[1]);

                    expect(points[18], 'x4').to.be.eql(p2[0] + perp2[0]);
                    expect(points[19], 'y4').to.be.eql(p2[1] + perp2[1]);

                    expect(points[24], 'x5').to.be.eql(p3[0] - perp2[0]);
                    expect(points[25], 'y5').to.be.eql(p3[1] - perp2[1]);

                    expect(points[30], 'x6').to.be.eql(p3[0] + perp2[0]);
                    expect(points[31], 'y6').to.be.eql(p3[1] + perp2[1]);
                }));
            });

            describe('bevel', function ()
            {
                it('clockwise bevel', withGL(function ()
                {
                    // given
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphics = new PIXI.Graphics();

                    graphics.lineStyle(2, 0, 1, 0.5);
                    graphics.lineJoin = 'bevel';

                    graphics.moveTo(0, 0);
                    graphics.lineTo(50, 0);
                    graphics.lineTo(50, 50);

                    // when
                    renderer.render(graphics);

                    // then
                    const glData = graphics._webGL[renderer.CONTEXT_UID].data[0];
                    const points = glData.points;

                    // 8 control points, xy each
                    expect(points.length / 2, 'number of control points is not right').to.be.equal(8);

                    expect(points[0], 'x1').to.be.eql(0);
                    expect(points[1], 'y1').to.be.eql(1);

                    expect(points[6], 'x2').to.be.eql(0);
                    expect(points[7], 'y2').to.be.eql(-1);

                    expect(points[12], 'x3').to.be.eql(49);
                    expect(points[13], 'y3').to.be.eql(1);

                    expect(points[18], 'x4').to.be.eql(50);
                    expect(points[19], 'y4').to.be.eql(-1);

                    expect(points[24], 'x5').to.be.eql(49);
                    expect(points[25], 'y5').to.be.eql(1);

                    expect(points[30], 'x6').to.be.eql(51);
                    expect(points[31], 'y6').to.be.eql(0);

                    expect(points[36], 'x7').to.be.eql(49);
                    expect(points[37], 'y7').to.be.eql(50);

                    expect(points[42], 'x8').to.be.eql(51);
                    expect(points[43], 'y8').to.be.eql(50);
                }));

                it('counterclockwise bevel', withGL(function ()
                {
                    // given
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphics = new PIXI.Graphics();

                    graphics.lineStyle(2, 0, 1, 0.5);
                    graphics.lineJoin = 'bevel';

                    graphics.moveTo(0, 0);
                    graphics.lineTo(50, 0);
                    graphics.lineTo(50, -50);

                    // when
                    renderer.render(graphics);

                    // then
                    const glData = graphics._webGL[renderer.CONTEXT_UID].data[0];
                    const points = glData.points;

                    // 8 control points, xy each
                    expect(points.length / 2, 'number of control points is not right').to.be.equal(8);

                    expect(points[0], 'x1').to.be.eql(0);
                    expect(points[1], 'y1').to.be.eql(1);

                    expect(points[6], 'x2').to.be.eql(0);
                    expect(points[7], 'y2').to.be.eql(-1);

                    expect(points[12], 'x3').to.be.eql(50);
                    expect(points[13], 'y3').to.be.eql(1);

                    expect(points[18], 'x4').to.be.eql(49);
                    expect(points[19], 'y4').to.be.eql(-1);

                    expect(points[24], 'x5').to.be.eql(51);
                    expect(points[25], 'y5').to.be.eql(0);

                    expect(points[30], 'x6').to.be.eql(49);
                    expect(points[31], 'y6').to.be.eql(-1);

                    expect(points[36], 'x7').to.be.eql(51);
                    expect(points[37], 'y7').to.be.eql(-50);

                    expect(points[42], 'x8').to.be.eql(49);
                    expect(points[43], 'y8').to.be.eql(-50);
                }));

                it('bevel join paralel lines', withGL(function ()
                {
                    // given
                    const p1 = [0, 0];
                    const p2 = [50, 0];
                    const p3 = [100, 0];
                    // normalized perpendicular vectors
                    const perp1 = [0, 1];
                    const perp2 = [0, -1];
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphicsMiter = new PIXI.Graphics();

                    graphicsMiter.lineStyle(2, 0, 1, 0.5);
                    graphicsMiter.lineJoin = 'bevel';

                    graphicsMiter.moveTo(p1[0], p1[1]);
                    graphicsMiter.lineTo(p2[0], p2[1]);
                    graphicsMiter.lineTo(p3[0], p3[1]);

                    // when
                    renderer.render(graphicsMiter);

                    // then
                    const points = graphicsMiter._webGL[renderer.CONTEXT_UID].data[0].points;

                    // 6 control points, xy each
                    expect(points.length / 2, 'number of control points is not right').to.be.equal(6);

                    expect(points[0], 'x1').to.be.eql(p1[0] + perp1[0]);
                    expect(points[1], 'y1').to.be.eql(p1[1] + perp1[1]);

                    expect(points[6], 'x2').to.be.eql(p1[0] - perp1[0]);
                    expect(points[7], 'y2').to.be.eql(p1[1] - perp1[1]);

                    expect(points[12], 'x3').to.be.eql(p2[0] + perp1[0]);
                    expect(points[13], 'y3').to.be.eql(p2[1] + perp1[1]);

                    expect(points[18], 'x4').to.be.eql(p2[0] + perp2[0]);
                    expect(points[19], 'y4').to.be.eql(p2[1] + perp2[1]);

                    expect(points[24], 'x5').to.be.eql(p3[0] - perp2[0]);
                    expect(points[25], 'y5').to.be.eql(p3[1] - perp2[1]);

                    expect(points[30], 'x6').to.be.eql(p3[0] + perp2[0]);
                    expect(points[31], 'y6').to.be.eql(p3[1] + perp2[1]);
                }));

                it('flat line bevel', withGL(function ()
                {
                    // given
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphics = new PIXI.Graphics();

                    graphics.lineStyle(2, 0, 1, 0.5);
                    graphics.lineJoin = 'bevel';

                    graphics.moveTo(0, 0);
                    graphics.lineTo(50, 0);
                    graphics.lineTo(100, 0);

                    // when
                    renderer.render(graphics);

                    // then
                    const glData = graphics._webGL[renderer.CONTEXT_UID].data[0];
                    const points = glData.points;

                    // 6 control points, xy each
                    expect(points.length / 2, 'number of control points is not right').to.be.equal(6);

                    expect(points[0], 'x1').to.be.eql(0);
                    expect(points[1], 'y1').to.be.eql(1);

                    expect(points[6], 'x2').to.be.eql(0);
                    expect(points[7], 'y2').to.be.eql(-1);

                    expect(points[12], 'x3').to.be.eql(50);
                    expect(points[13], 'y3').to.be.eql(1);

                    expect(points[18], 'x5').to.be.eql(50);
                    expect(points[19], 'y5').to.be.eql(-1);

                    expect(points[24], 'x7').to.be.eql(100);
                    expect(points[25], 'y7').to.be.eql(1);

                    expect(points[30], 'x8').to.be.eql(100);
                    expect(points[31], 'y8').to.be.eql(-1);
                }));
            });

            describe('round', function ()
            {
                it('round join clockwise', withGL(function ()
                {
                    // given
                    const p1 = [0, 0];
                    const p2 = [50, 0];
                    const p3 = [50, 50];
                    // normalized perpendicular vectors
                    const perp1 = [0, -1];
                    const perp2 = [1, 0];
                    const anchor = [p2[0] - perp1[0] - perp2[0], p2[1] - perp1[1] - perp2[1]];
                    // doubles cause every point is followed with center point
                    // 1 + 1 + 15 * absAngleDiff * Math.sqrt(radius) / Math.PI
                    const noOfCtlPts = 6 * 2;
                    const r = 2.23606797749979; // sqrt(1^2 + 2^2)
                    const angleIncrease = -0.12870022175865686; // anlge diff / 5
                    let angle = 2.677945044588987; // Math.atan2(1, -2)
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphics = new PIXI.Graphics();

                    graphics.lineStyle(2, 0, 1, 0.5);
                    graphics.lineJoin = 'round';

                    graphics.moveTo(p1[0], p1[1]);
                    graphics.lineTo(p2[0], p2[1]);
                    graphics.lineTo(p3[0], p3[1]);

                    // when
                    renderer.render(graphics);

                    // then
                    const glData = graphics._webGL[renderer.CONTEXT_UID].data[0];
                    const points = glData.points;

                    // 6 control points, xy each
                    expect(points.length / 2, 'number of control points is not right').to.be.equal((4 + noOfCtlPts));

                    expect(points[0], 'x1').to.be.eql(p1[0] - perp1[0]);
                    expect(points[1], 'y1').to.be.eql(p1[1] - perp1[1]);

                    expect(points[6], 'x2').to.be.eql(p1[0] + perp1[0]);
                    expect(points[7], 'y2').to.be.eql(p1[1] + perp1[1]);

                    // center
                    expect(points[12], 'center1 x').to.be.eql(anchor[0]);
                    expect(points[13], 'center1 y').to.be.eql(anchor[1]);

                    expect(points[24], 'center2 x').to.be.eql(anchor[0]);
                    expect(points[25], 'center2 y').to.be.eql(anchor[1]);

                    expect(points[36], 'center3 x').to.be.eql(anchor[0]);
                    expect(points[37], 'center3 y').to.be.eql(anchor[1]);

                    expect(points[48], 'center4 x').to.be.eql(anchor[0]);
                    expect(points[49], 'center4 y').to.be.eql(anchor[1]);

                    expect(points[60], 'center5 x').to.be.eql(anchor[0]);
                    expect(points[61], 'center5 y').to.be.eql(anchor[1]);

                    expect(points[72], 'center6 x').to.be.eql(anchor[0]);
                    expect(points[73], 'center6 y').to.be.eql(anchor[1]);

                    // peripheral pts
                    expect(points[18], 'peripheral1 x').to.be.eql(p2[0] + perp1[0]);
                    expect(points[19], 'peripheral1 y').to.be.eql(p2[1] + perp1[1]);

                    angle += angleIncrease;
                    expect(points[30], 'peripheral2 x').to.be.eql(anchor[0] + (Math.sin(angle) * r));
                    expect(points[31], 'peripheral2 y').to.be.eql(anchor[1] + (Math.cos(angle) * r));

                    angle += angleIncrease;
                    expect(points[42], 'peripheral3 x').to.be.eql(anchor[0] + (Math.sin(angle) * r));
                    expect(points[43], 'peripheral3 y').to.be.eql(anchor[1] + (Math.cos(angle) * r));

                    angle += angleIncrease;
                    expect(points[54], 'peripheral4 x').to.be.eql(anchor[0] + (Math.sin(angle) * r));
                    expect(points[55], 'peripheral4 y').to.be.eql(anchor[1] + (Math.cos(angle) * r));

                    angle += angleIncrease;
                    expect(points[66], 'peripheral5 x').to.be.eql(anchor[0] + (Math.sin(angle) * r));
                    expect(points[67], 'peripheral5 y').to.be.eql(anchor[1] + (Math.cos(angle) * r));

                    expect(points[78], 'peripheral6 x').to.be.eql(p2[0] + perp2[0]);
                    expect(points[79], 'peripheral6 y').to.be.eql(p2[1] + perp2[1]);

                    expect(points[84], 'x[last-1]').to.be.eql(p3[0] - perp2[0]);
                    expect(points[85], 'y[last-1]').to.be.eql(p3[1] - perp2[1]);

                    expect(points[90], 'x[last]').to.be.eql(p3[0] + perp2[0]);
                    expect(points[91], 'y[last]').to.be.eql(p3[1] + perp2[1]);
                }));

                it('round join counterclockwise', withGL(function ()
                {
                    // given
                    const p1 = [0, 0];
                    const p2 = [50, 0];
                    const p3 = [50, -50];
                    // normalized perpendicular vectors
                    const perp1 = [0, 1];
                    const perp2 = [1, 0];
                    const anchor = [p2[0] - perp1[0] - perp2[0], p2[1] - perp1[1] - perp2[1]];
                    // doubles cause every point is followed with center point
                    // 1 + 1 + 15 * absAngleDiff * Math.sqrt(radius) / Math.PI
                    const noOfCtlPts = 6 * 2;
                    const r = 2.23606797749979; // sqrt(1^2 + 2^2)
                    const angleIncrease = 0.12870022175865686; // anlge diff / 5
                    let angle = 0.4636476090008061; // Math.atan2(1, -2)
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphics = new PIXI.Graphics();

                    graphics.lineStyle(2, 0, 1, 0.5);
                    graphics.lineJoin = 'round';

                    graphics.moveTo(p1[0], p1[1]);
                    graphics.lineTo(p2[0], p2[1]);
                    graphics.lineTo(p3[0], p3[1]);

                    // when
                    renderer.render(graphics);

                    // then
                    const glData = graphics._webGL[renderer.CONTEXT_UID].data[0];
                    const points = glData.points;

                    // 6 control points, xy each
                    expect(points.length / 2, 'number of control points is not right').to.be.equal((4 + noOfCtlPts));

                    expect(points[0], 'x1').to.be.eql(p1[0] + perp1[0]);
                    expect(points[1], 'y1').to.be.eql(p1[1] + perp1[1]);

                    expect(points[6], 'x2').to.be.eql(p1[0] - perp1[0]);
                    expect(points[7], 'y2').to.be.eql(p1[1] - perp1[1]);

                    // center
                    expect(points[18], 'center1 x').to.be.eql(anchor[0]);
                    expect(points[19], 'center1 y').to.be.eql(anchor[1]);

                    expect(points[30], 'center2 x').to.be.eql(anchor[0]);
                    expect(points[31], 'center2 y').to.be.eql(anchor[1]);

                    expect(points[42], 'center3 x').to.be.eql(anchor[0]);
                    expect(points[43], 'center3 y').to.be.eql(anchor[1]);

                    expect(points[54], 'center4 x').to.be.eql(anchor[0]);
                    expect(points[55], 'center4 y').to.be.eql(anchor[1]);

                    expect(points[66], 'center5 x').to.be.eql(anchor[0]);
                    expect(points[67], 'center5 y').to.be.eql(anchor[1]);

                    expect(points[78], 'center6 x').to.be.eql(anchor[0]);
                    expect(points[79], 'center6 y').to.be.eql(anchor[1]);

                    // peripheral pts
                    expect(points[12], 'peripheral1 x').to.be.eql(p2[0] + perp1[0]);
                    expect(points[13], 'peripheral1 y').to.be.eql(p2[1] + perp1[1]);

                    angle += angleIncrease;
                    expect(points[24], 'peripheral2 x').to.be.eql(anchor[0] + (Math.sin(angle) * r));
                    expect(points[25], 'peripheral2 y').to.be.eql(anchor[1] + (Math.cos(angle) * r));

                    angle += angleIncrease;
                    expect(points[36], 'peripheral3 x').to.be.eql(anchor[0] + (Math.sin(angle) * r));
                    expect(points[37], 'peripheral3 y').to.be.eql(anchor[1] + (Math.cos(angle) * r));

                    angle += angleIncrease;
                    expect(points[48], 'peripheral4 x').to.be.eql(anchor[0] + (Math.sin(angle) * r));
                    expect(points[49], 'peripheral4 y').to.be.eql(anchor[1] + (Math.cos(angle) * r));

                    angle += angleIncrease;
                    expect(points[60], 'peripheral5 x').to.be.eql(anchor[0] + (Math.sin(angle) * r));
                    expect(points[61], 'peripheral5 y').to.be.eql(anchor[1] + (Math.cos(angle) * r));

                    expect(points[72], 'peripheral6 x').to.be.eql(p2[0] + perp2[0]);
                    expect(points[73], 'peripheral6 y').to.be.eql(p2[1] + perp2[1]);

                    expect(points[84], 'x[last-1]').to.be.eql(p3[0] + perp2[0]);
                    expect(points[85], 'y[last-1]').to.be.eql(p3[1] + perp2[1]);

                    expect(points[90], 'x[last]').to.be.eql(p3[0] - perp2[0]);
                    expect(points[91], 'y[last]').to.be.eql(p3[1] - perp2[1]);
                }));

                it('round join back and forth', withGL(function ()
                {
                    // given
                    const p1 = [0, 0];
                    const p2 = [50, 0];
                    const p3 = [10, 0];
                    // normalized perpendicular vectors
                    const perp1 = [0, -1];
                    const perp2 = [0, 1];
                    const anchor = [p2[0], p2[1]];
                    // doubles cause every point is followed with center point
                    // 1 + 1 + 15 * absAngleDiff * Math.sqrt(radius) / Math.PI
                    const noOfCtlPts = 16 * 2;
                    const r = 1;
                    const angleIncrease = -0.20943951023931953;
                    let angle = 3.141592653589793;
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphics = new PIXI.Graphics();

                    graphics.lineStyle(2, 0, 1, 0.5);
                    graphics.lineJoin = 'round';

                    graphics.moveTo(p1[0], p1[1]);
                    graphics.lineTo(p2[0], p2[1]);
                    graphics.lineTo(p3[0], p3[1]);

                    // when
                    renderer.render(graphics);

                    // then
                    const glData = graphics._webGL[renderer.CONTEXT_UID].data[0];
                    const points = glData.points;
                    const len = points.length;

                    // 6 control points, xy each
                    expect(len / 6, 'number of control points is not right').to.be.equal((4 + noOfCtlPts));

                    expect(points[0], 'x1').to.be.eql(p1[0] - perp1[0]);
                    expect(points[1], 'y1').to.be.eql(p1[1] - perp1[1]);

                    expect(points[6], 'x2').to.be.eql(p1[0] + perp1[0]);
                    expect(points[7], 'y2').to.be.eql(p1[1] + perp1[1]);

                    // center
                    for (let i = 12, j = 1; j <= 16; i += 12, j++)
                    {
                        expect(points[i], `center${j} x`).to.be.eql(p2[0]);
                        expect(points[i + 1], `center${j} y`).to.be.eql(p2[1]);
                    }

                    // peripheral pts

                    expect(points[18], 'peripheral1 x').to.be.eql(p2[0] + perp1[0]);
                    expect(points[19], 'peripheral1 y').to.be.eql(p2[1] + perp1[1]);

                    for (let i = 30, j = 2; j < 16; i += 12, j++)
                    {
                        angle += angleIncrease;
                        expect(points[i], `peripheral${j} x`).to.be.eql(anchor[0] + (Math.sin(angle) * r));
                        expect(points[i + 1], `peripheral${j} y`).to.be.eql(anchor[1] + (Math.cos(angle) * r));
                    }

                    expect(points[len - 18], 'peripheral16 x').to.be.eql(p2[0] + perp2[0]);
                    expect(points[len - 17], 'peripheral16 y').to.be.eql(p2[1] + perp2[1]);

                    expect(points[len - 12], 'x[last-1]').to.be.eql(p3[0] - perp2[0]);
                    expect(points[len - 11], 'y[last-1]').to.be.eql(p3[1] - perp2[1]);

                    expect(points[len - 6], 'x[last]').to.be.eql(p3[0] + perp2[0]);
                    expect(points[len - 5], 'y[last]').to.be.eql(p3[1] + perp2[1]);
                }));

                it('round join back and forth other way around', withGL(function ()
                {
                    // given
                    const p1 = [0, 0];
                    const p2 = [-50, 0];
                    const p3 = [10, 0];
                    // normalized perpendicular vectors
                    const perp1 = [0, 1];
                    const perp2 = [0, -1];
                    const anchor = [p2[0], p2[1]];
                    // doubles cause every point is followed with center point
                    // 1 + 1 + 15 * absAngleDiff * Math.sqrt(radius) / Math.PI
                    const noOfCtlPts = 16 * 2;
                    const r = 1;
                    const angleIncrease = -0.20943951023931953;
                    let angle = 0;
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphics = new PIXI.Graphics();

                    graphics.lineStyle(2, 0, 1, 0.5);
                    graphics.lineJoin = 'round';

                    graphics.moveTo(p1[0], p1[1]);
                    graphics.lineTo(p2[0], p2[1]);
                    graphics.lineTo(p3[0], p3[1]);

                    // when
                    renderer.render(graphics);

                    // then
                    const glData = graphics._webGL[renderer.CONTEXT_UID].data[0];
                    const points = glData.points;
                    const len = points.length;

                    // 6 control points, xy each
                    expect(len / 6, 'number of control points is not right').to.be.equal((4 + noOfCtlPts));

                    expect(points[0], 'x1').to.be.eql(p1[0] - perp1[0]);
                    expect(points[1], 'y1').to.be.eql(p1[1] - perp1[1]);

                    expect(points[6], 'x2').to.be.eql(p1[0] + perp1[0]);
                    expect(points[7], 'y2').to.be.eql(p1[1] + perp1[1]);

                    // center
                    for (let i = 12, j = 1; j <= 16; i += 12, j++)
                    {
                        expect(points[i], `center${j} x`).to.be.eql(p2[0]);
                        expect(points[i + 1], `center${j} y`).to.be.eql(p2[1]);
                    }

                    // peripheral pts

                    expect(points[18], 'peripheral1 x').to.be.eql(p2[0] + perp1[0]);
                    expect(points[19], 'peripheral1 y').to.be.eql(p2[1] + perp1[1]);

                    for (let i = 30, j = 2; j < 16; i += 12, j++)
                    {
                        angle += angleIncrease;
                        expect(points[i], `peripheral${j} x`).to.be.eql(anchor[0] + (Math.sin(angle) * r));
                        expect(points[i + 1], `peripheral${j} y`).to.be.eql(anchor[1] + (Math.cos(angle) * r));
                    }

                    expect(points[len - 18], 'peripheral16 x').to.be.eql(p2[0] + perp2[0]);
                    expect(points[len - 17], 'peripheral16 y').to.be.eql(p2[1] + perp2[1]);

                    expect(points[len - 12], 'x[last-1]').to.be.eql(p3[0] - perp2[0]);
                    expect(points[len - 11], 'y[last-1]').to.be.eql(p3[1] - perp2[1]);

                    expect(points[len - 6], 'x[last]').to.be.eql(p3[0] + perp2[0]);
                    expect(points[len - 5], 'y[last]').to.be.eql(p3[1] + perp2[1]);
                }));

                it('flat line round', withGL(function ()
                {
                    // given
                    const renderer = new PIXI.WebGLRenderer(200, 200, {});
                    const graphics = new PIXI.Graphics();

                    graphics.lineStyle(2, 0, 1, 0.5);
                    graphics.lineJoin = 'round';

                    graphics.moveTo(0, 0);
                    graphics.lineTo(50, 0);
                    graphics.lineTo(100, 0);

                    // when
                    renderer.render(graphics);

                    // then
                    const glData = graphics._webGL[renderer.CONTEXT_UID].data[0];
                    const points = glData.points;

                    // 6 control points, xy each
                    expect(points.length / 2, 'number of control points is not right').to.be.equal(6);

                    expect(points[0], 'x1').to.be.eql(0);
                    expect(points[1], 'y1').to.be.eql(1);

                    expect(points[6], 'x2').to.be.eql(0);
                    expect(points[7], 'y2').to.be.eql(-1);

                    expect(points[12], 'x3').to.be.eql(50);
                    expect(points[13], 'y3').to.be.eql(1);

                    expect(points[18], 'x4').to.be.eql(50);
                    expect(points[19], 'y4').to.be.eql(-1);

                    expect(points[24], 'x5').to.be.eql(100);
                    expect(points[25], 'y5').to.be.eql(1);

                    expect(points[30], 'x6').to.be.eql(100);
                    expect(points[31], 'y6').to.be.eql(-1);
                }));
            });
        });
    });

    describe('containsPoint', function ()
    {
        it('should return true when point inside', function ()
        {
            const point = new Point(1, 1);
            const graphics = new Graphics();

            graphics.beginFill(0);
            graphics.drawRect(0, 0, 10, 10);

            expect(graphics.containsPoint(point)).to.be.true;
        });

        it('should return false when point outside', function ()
        {
            const point = new Point(20, 20);
            const graphics = new Graphics();

            graphics.beginFill(0);
            graphics.drawRect(0, 0, 10, 10);

            expect(graphics.containsPoint(point)).to.be.false;
        });

        it('should return false when no fill', function ()
        {
            const point = new Point(1, 1);
            const graphics = new Graphics();

            graphics.drawRect(0, 0, 10, 10);

            expect(graphics.containsPoint(point)).to.be.false;
        });

        it('should return false with hole', function ()
        {
            const point1 = new Point(1, 1);
            const point2 = new Point(5, 5);
            const graphics = new Graphics();

            graphics.beginFill(0)
                .moveTo(0, 0)
                .lineTo(10, 0)
                .lineTo(10, 10)
                .lineTo(0, 10)
                .beginHole()
                .moveTo(2, 2)
                .lineTo(8, 2)
                .lineTo(8, 8)
                .lineTo(2, 8)
                .endHole();

            expect(graphics.containsPoint(point1)).to.be.true;
            expect(graphics.containsPoint(point2)).to.be.false;
        });
    });

    describe('chaining', function ()
    {
        it('should chain draw commands', function ()
        {
            // complex drawing #1: draw triangle, rounder rect and an arc (issue #3433)
            const graphics = new Graphics().beginFill(0xFF3300)
                .lineStyle(4, 0xffd900, 1)
                .moveTo(50, 50)
                .lineTo(250, 50)
                .endFill()
                .drawRoundedRect(150, 450, 300, 100, 15)
                .beginHole()
                .endHole()
                .quadraticCurveTo(1, 1, 1, 1)
                .bezierCurveTo(1, 1, 1, 1)
                .arcTo(1, 1, 1, 1, 1)
                .arc(1, 1, 1, 1, 1, false)
                .drawRect(1, 1, 1, 1)
                .drawRoundedRect(1, 1, 1, 1, 0.1)
                .drawCircle(1, 1, 20)
                .drawEllipse(1, 1, 1, 1)
                .drawPolygon([1, 1, 1, 1, 1, 1])
                .drawStar(1, 1, 1, 1, 1, 1)
                .clear();

            expect(graphics).to.be.not.null;
        });
    });

    describe('arc', function ()
    {
        it('should draw an arc', function ()
        {
            const graphics = new Graphics();

            expect(graphics.currentPath).to.be.null;

            expect(() => graphics.arc(100, 30, 20, 0, Math.PI)).to.not.throw();

            expect(graphics.currentPath).to.be.not.null;
        });

        it('should not throw with other shapes', function ()
        {
            // complex drawing #1: draw triangle, rounder rect and an arc (issue #3433)
            const graphics = new Graphics();

            // set a fill and line style
            graphics.beginFill(0xFF3300);
            graphics.lineStyle(4, 0xffd900, 1);

            // draw a shape
            graphics.moveTo(50, 50);
            graphics.lineTo(250, 50);
            graphics.lineTo(100, 100);
            graphics.lineTo(50, 50);
            graphics.endFill();

            graphics.lineStyle(2, 0xFF00FF, 1);
            graphics.beginFill(0xFF00BB, 0.25);
            graphics.drawRoundedRect(150, 450, 300, 100, 15);
            graphics.endFill();

            graphics.beginFill();
            graphics.lineStyle(4, 0x00ff00, 1);

            expect(() => graphics.arc(300, 100, 20, 0, Math.PI)).to.not.throw();
        });

        it('should do nothing when startAngle and endAngle are equal', function ()
        {
            const graphics = new Graphics();

            expect(graphics.currentPath).to.be.null;

            graphics.arc(0, 0, 10, 0, 0);

            expect(graphics.currentPath).to.be.null;
        });

        it('should do nothing if sweep equals zero', function ()
        {
            const graphics = new Graphics();

            expect(graphics.currentPath).to.be.null;

            graphics.arc(0, 0, 10, 10, 10);

            expect(graphics.currentPath).to.be.null;
        });
    });

    describe('_calculateBounds', function ()
    {
        it('should only call updateLocalBounds once', function ()
        {
            const graphics = new Graphics();
            const spy = sinon.spy(graphics.geometry, 'calculateBounds');

            graphics._calculateBounds();

            expect(spy).to.have.been.calledOnce;

            graphics._calculateBounds();

            expect(spy).to.have.been.calledOnce;
        });
    });

    describe('drawCircle', function ()
    {
        it('should have no gaps in line border', withGL(function ()
        {
            const renderer = new Renderer(200, 200, {});

            try
            {
                const graphics = new Graphics();

                graphics.lineStyle(15, 0x8FC7E6);
                graphics.drawCircle(100, 100, 30);
                renderer.render(graphics);
                const points = graphics.geometry.graphicsData[0].points;

                const firstX = points[0];
                const firstY = points[1];

                const lastX = points[points.length - 2];
                const lastY = points[points.length - 1];

                expect(firstX).to.equals(lastX);
                expect(firstY).to.equals(lastY);
            }
            finally
            {
                renderer.destroy();
            }
        }));
    });

    describe('startPoly', function ()
    {
        it('should fill two triangles', withGL(function ()
        {
            const graphics = new Graphics();

            graphics.beginFill(0xffffff, 1.0);
            graphics.moveTo(50, 50);
            graphics.lineTo(250, 50);
            graphics.lineTo(100, 100);
            graphics.lineTo(50, 50);

            graphics.moveTo(250, 50);
            graphics.lineTo(450, 50);
            graphics.lineTo(300, 100);
            graphics.lineTo(250, 50);
            graphics.endFill();

            const data = graphics.geometry.graphicsData;

            expect(data.length).to.equals(2);
            expect(data[0].shape.points).to.eql([50, 50, 250, 50, 100, 100, 50, 50]);
            expect(data[1].shape.points).to.eql([250, 50, 450, 50, 300, 100, 250, 50]);
        }));

        it('should honor lineStyle break', withGL(function ()
        {
            const graphics = new Graphics();

            graphics.lineStyle(1.0, 0xffffff);
            graphics.moveTo(50, 50);
            graphics.lineTo(250, 50);
            graphics.lineStyle(2.0, 0xffffff);
            graphics.lineTo(100, 100);
            graphics.lineTo(50, 50);
            graphics.lineStyle(0.0);

            const data = graphics.geometry.graphicsData;

            expect(data.length).to.equals(2);
            expect(data[0].shape.points).to.eql([50, 50, 250, 50]);
            expect(data[1].shape.points).to.eql([250, 50, 100, 100, 50, 50]);
        }));
    });
});