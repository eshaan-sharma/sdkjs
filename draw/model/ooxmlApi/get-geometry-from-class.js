/*
 * (c) Copyright Ascensio System SIA 2010-2023
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-6 Ernesta Birznieka-Upish
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */


(function geometryFromClassApi(window, document) {
	// works with visio class
	// NOT FINISHED

	var FORMULA_TYPE_MULT_DIV = 0,
		FORMULA_TYPE_PLUS_MINUS = 1,
		FORMULA_TYPE_PLUS_DIV = 2,
		FORMULA_TYPE_IF_ELSE =3,
		FORMULA_TYPE_ABS = 4,
		FORMULA_TYPE_AT2 = 5,
		FORMULA_TYPE_CAT2 = 6,
		FORMULA_TYPE_COS = 7,
		FORMULA_TYPE_MAX = 8,
		FORMULA_TYPE_MOD = 9,
		FORMULA_TYPE_PIN = 10,
		FORMULA_TYPE_SAT2 = 11,
		FORMULA_TYPE_SIN = 12,
		FORMULA_TYPE_SQRT = 13,
		FORMULA_TYPE_TAN = 14,
		FORMULA_TYPE_VALUE = 15,
		FORMULA_TYPE_MIN = 16;

	var MAP_FMLA_TO_TYPE = {};
	MAP_FMLA_TO_TYPE["*/"] = FORMULA_TYPE_MULT_DIV;
	MAP_FMLA_TO_TYPE["+-"] = FORMULA_TYPE_PLUS_MINUS;
	MAP_FMLA_TO_TYPE["+/"] = FORMULA_TYPE_PLUS_DIV;
	MAP_FMLA_TO_TYPE["?:"] = FORMULA_TYPE_IF_ELSE;
	MAP_FMLA_TO_TYPE["abs"] = FORMULA_TYPE_ABS;
	MAP_FMLA_TO_TYPE["at2"] = FORMULA_TYPE_AT2;
	MAP_FMLA_TO_TYPE["cat2"] = FORMULA_TYPE_CAT2;
	MAP_FMLA_TO_TYPE["cos"] = FORMULA_TYPE_COS;
	MAP_FMLA_TO_TYPE["max"] = FORMULA_TYPE_MAX;
	MAP_FMLA_TO_TYPE["min"] = FORMULA_TYPE_MIN;
	MAP_FMLA_TO_TYPE["mod"] = FORMULA_TYPE_MOD;
	MAP_FMLA_TO_TYPE["pin"] = FORMULA_TYPE_PIN;
	MAP_FMLA_TO_TYPE["sat2"] = FORMULA_TYPE_SAT2;
	MAP_FMLA_TO_TYPE["sin"] = FORMULA_TYPE_SIN;
	MAP_FMLA_TO_TYPE["sqrt"] = FORMULA_TYPE_SQRT;
	MAP_FMLA_TO_TYPE["tan"] = FORMULA_TYPE_TAN;
	MAP_FMLA_TO_TYPE["val"] = FORMULA_TYPE_VALUE;

	const degToC = 60000;
	const radToDeg = 180 / Math.PI;
	const radToC = radToDeg * degToC;

	const mmToEmuCoef = 36000;
	const emuToMM = 1/36000;

	function getRandomPrst() {
		let types = AscCommon.g_oAutoShapesTypes[Math.floor(Math.random()*AscCommon.g_oAutoShapesTypes.length)];
		return types[Math.floor(Math.random()*types.length)].Type;
	}

	/**
	 *
	 * @param {number} mm
	 * @returns {number} emus
	 */
	function mmToEmu(mm) {
		// Conversion factor: 1 cm = 360000 EMUs, 1 cm = 10 mm
		const emusPerCm = 360000;
		const mmPerCm = 10;

		// Calculate EMUs from millimeters using the new conversion factor
		const emus = mm * (emusPerCm / mmPerCm);
		return emus;
	}

	/**
	 * Calls mmToEmu on value:
	 * value * additionalUnitKoef then convert to Emus
	 * @param {number} value - inchUnits value
	 * @param {number} additionalUnitKoef
	 * @param {number?} shapeHeightInch
	 * @param {boolean} isInvertY
	 * @returns {number} valueCorrectUnits
	 */
	function convertUnits(valueInch, additionalUnitKoef, shapeHeightInch, isInvertY) {
		let valueCorrectUnits;
		if (shapeHeightInch !== undefined && isInvertY) {
			valueCorrectUnits = mmToEmu((shapeHeightInch - valueInch) * additionalUnitKoef);
		} else  {
			valueCorrectUnits = mmToEmu(valueInch * additionalUnitKoef);
		}
		return valueCorrectUnits;
	}

	/**
	 * afin rotate clockwise
	 * @param {number} x
	 * @param {number} y
	 * @param {number} radiansRotateAngle radians Rotate AntiClockWise Angle. E.g. 30 degrees rotates does DOWN.
	 * @returns {{x: number, y: number}} point
	 */
	function rotatePointAroundCordsStartClockWise(x, y, radiansRotateAngle) {
		let newX = x * Math.cos(radiansRotateAngle) + y * Math.sin(radiansRotateAngle);
		let newY = x * (-1) * Math.sin(radiansRotateAngle) + y * Math.cos(radiansRotateAngle);
		return {x : newX, y: newY};
	}

	/**
	 * get Geometry object from shape object reading shape elements
	 * @param {Shape_Type} shape
	 * @param {number} pageScale
	 * @param {boolean} isInvertY
	 * @param {number} logicHinch
	 * @returns {Geometry} geometry
	 */
	function getGeometryFromShape(shape, pageScale, isInvertY, logicHinch) {
		// init geometry
		let geometry = new AscFormat.Geometry();

		isInvertY = true;

		// in visio Geometry section represents Path:
		// A path is a collection of vertices and line or curve segments that specifies an enclosed area.
		// The geometry of a shape is specified by a collection of paths.
		// Each Geometry (Section_Type) element specifies a path.
		let geometrySections = shape.getSections("Geometry");

		// NEW VERSION: MAKE ONE TWO PATHS PER SHAPE:
		// One path for path with strokes for them to subtract but:
		// - it may not work well with more than 2 geometry path
		// - we cant set different setStroke for geometry paths now because it is one path now
		// see test folder https://disk.yandex.ru/d/_MQCkWbngkSz8w
		// 25.12.2023 commit
		let pathWithFill = new AscFormat.Path();
		let pathWithoutFill = new AscFormat.Path();

		pathWithFill.setExtrusionOk(false);
		pathWithFill.setFill("norm");
		pathWithFill.setStroke(true);
		pathWithFill.setPathW(undefined);
		pathWithFill.setPathH(undefined);

		pathWithoutFill.setExtrusionOk(false);
		pathWithoutFill.setFill("none");
		pathWithoutFill.setStroke(true);
		pathWithoutFill.setPathW(undefined);
		pathWithoutFill.setPathH(undefined);

		// for path overlap fix: If there is only equal geometry section NoLine values
		// we can set true NoLine value for path
		let filledPathNoLine = false;
		let unfilledPathNoLine = false;
		let allFilledPathNoLineValuesEqual = true;
		let allUnfilledPathNoLineValuesEqual = true;

		// set path objects - parts of geometry objects
		for (let i = 0; i < geometrySections.length; i++) {
			const geometrySection = geometrySections[i];
			// see [MS-VSDX]-220215 2.2.3.2.2.Geometry Path

			//	<xsd:complexType name="Geometry_Type">
			// 		<xsd:complexContent>
			// 			<xsd:extension base="Section_Type">
			// 				<xsd:choice minOccurs="0" maxOccurs="unbounded">
			// 					<xsd:element name="Cell" type="Cell_Type" minOccurs="0" maxOccurs="unbounded">
			// 						<xsd:alternative test="@N = 'NoFill'" type="NoFill_Type"/>
			// 						<xsd:alternative test="@N = 'NoLine'" type="NoLine_Type"/>
			// 						<xsd:alternative test="@N = 'NoShow'" type="NoShow_Type"/>
			// 						<xsd:alternative test="@N = 'NoSnap'" type="NoSnap_Type"/>
			// 						<xsd:alternative test="@N = 'NoQuickDrag'" type="NoQuickDrag_Type"/>
			// 						<xsd:alternative test="@N = 'Path'" type="Path_Type"/>
			// 					</xsd:element>
			// 					<xsd:element name="Row" type="GeometryRow_Type" minOccurs="0" maxOccurs="unbounded">
			// 						<xsd:alternative test="@T = 'MoveTo'" type="MoveTo_Type"/>
			// 						<xsd:alternative test="@T = 'RelMoveTo'" type="RelMoveTo_Type"/>
			// 						<xsd:alternative test="@T = 'LineTo'" type="LineTo_Type"/>
			// 						<xsd:alternative test="@T = 'RelLineTo'" type="RelLineTo_Type"/>
			// 						<xsd:alternative test="@T = 'ArcTo'" type="ArcTo_Type"/>
			// 						<xsd:alternative test="@T = 'InfiniteLine'" type="InfiniteLine_Type"/>
			// 						<xsd:alternative test="@T = 'Ellipse'" type="Ellipse_Type"/>
			// 						<xsd:alternative test="@T = 'EllipticalArcTo'" type="EllipticalArcTo_Type"/>
			// 						<xsd:alternative test="@T = 'RelEllipticalArcTo'" type="RelEllipticalArcTo_Type"/>
			// 						<xsd:alternative test="@T = 'SplineStart'" type="SplineStart_Type"/>
			// 						<xsd:alternative test="@T = 'SplineKnot'" type="SplineKnot_Type"/>
			// 						<xsd:alternative test="@T = 'PolylineTo'" type="PolylineTo_Type"/>
			// 						<xsd:alternative test="@T = 'NURBSTo'" type="NURBSTo_Type"/>
			// 						<xsd:alternative test="@T = 'RelCubBezTo'" type="RelCubBezTo_Type"/>
			// 						<xsd:alternative test="@T = 'RelQuadBezTo'" type="RelQuadBezTo_Type"/>
			// 					</xsd:element>
			// 				</xsd:choice>
			// 			</xsd:extension>
			// 		</xsd:complexContent>
			// 	</xsd:complexType>

			// The visibility of the path’s line and the visibility of the path’s fill are specified, respectively,
			// by the NoLine and NoFill Cell_Type child elements of the path’s Geometry Section_Type element.

			// While the format of the path’s line and the format of the path’s fill are specified, respectively,
			// by the line property and fill property of the shape containing the path.

			// For a path to be visible, the following conditions are necessary.
			// §	The shape containing the path is not on a layer whose Visible Cell_Type element has a value equal to zero.
			// §	The value of the NoShow Cell_Type child of the path’s Geometry Section_Type element is not equal to one.

			// NoSnap is not related to drawing.
			// NoQuickDrag is not related to drawing too. It doesn't allow us to select the shape.

			// The Path trigger is unused and MUST be ignored.

			// So Geometry section defines (for drawing): path (by rows), isShown (NoShow), NoLine, NoFill
			// So we can represent visio Geometry section using Path object
			// Use it below

			let noShowCell = geometrySection.getCell("NoShow");

			if (noShowCell === null || noShowCell === undefined) {
				console.log("noShowCell variable is null or undefined see shape: ", shape);
				continue;
			}
			if (Number(noShowCell.v) === 1) {
				continue;
			}

			let noFillCell = geometrySection.getCell("NoFill");
			let fillValue;
			if (noFillCell) {
				fillValue = Number(noFillCell.v) === 1 ? "none" : "norm";
			} else {
				fillValue = "norm";
			}

			let noLineCell = geometrySection.getCell("NoLine");
			let noLineValue = false;
			if (noLineCell) {
				noLineValue = Number(noLineCell.v) === 1;
			} else {
				noLineValue = false;
			}

			let path;

			// use one of two available path objects
			if (fillValue === "norm") {
				path = pathWithFill;
				if (i !== 0 && noLineValue !== filledPathNoLine) {
					// if new !== first
					allFilledPathNoLineValuesEqual = false;
				} else {
					filledPathNoLine = noLineValue;
				}
			} else {
				path = pathWithoutFill;
				if (i !== 0 && noLineValue !== unfilledPathNoLine) {
					allUnfilledPathNoLineValuesEqual = false;
				} else {
					unfilledPathNoLine = noLineValue;
				}
			}


			// imply that units were in mm until units parse realized
			// TODO parse formula and units
			// TODO parse line style fill style text style

			const additionalUnitCoefficient = g_dKoef_in_to_mm / pageScale;


			/* extrusionOk, fill, stroke, w, h*/
			// path.AddPathCommand(0, undefined, fillValue, undefined, undefined, undefined);

			//TODO maybe get shapeWidthInch and Height from outside
			//TODO shape with RelMoveTo and RelLineTo takes wrong position

			let shapeWidthInch = Number(shape.getCell("Width").v);
			let shapeHeightInch = Number(shape.getCell("Height").v);

			/**
			 *
			 * @type {{x: number, y: number}}
			 */
			let lastPoint = { x: 0, y : 0};

			/**
			 * https://learn.microsoft.com/en-us/office/client-developer/visio/splinestart-row-geometry-section
			 * fistControlPoint is taken from previous command
			 * @type {{
			 *   	firstControlPointX,
			 * 		firstControlPointY,
			 * 		secondControlPointX,
			 * 		secondControlPointY,
			 * 		secondKnot,
			 * 		firstKnot,
			 * 		lastKnot,
			 * 		degree
			 * }}
			 */
			let splineStartCommandData;
			/**
			 * https://learn.microsoft.com/en-us/office/client-developer/visio/splineknot-row-geometry-section
			 * @type {{controlPointX, controlPointY, knot}[]}
			 */
			let splineKnotCommandsData = [];
			let prevCommandName;

			for (let j = 0; true; j++) {
				let rowNum = j + 1;
				let commandRow = geometrySection.getRow(rowNum);
				if (!commandRow) {
					break;
				}
				if (commandRow.del) {
					continue;
				}
				let commandName = commandRow.t;

				switch (commandName) {
					case "MoveTo":
					{
						let moveToXTextValue = Number(commandRow.getCell("X").v);
						let moveToYTextValue = Number(commandRow.getCell("Y").v);

						let newX = convertUnits(moveToXTextValue, additionalUnitCoefficient);
						let newY = convertUnits(moveToYTextValue, additionalUnitCoefficient, shapeHeightInch, isInvertY);

						path.moveTo(newX, newY);
						lastPoint.x = newX;
						lastPoint.y = newY;
						break;
					}
					case "RelMoveTo":
					{
						let relMoveToXTextValue = Number(commandRow.getCell("X").v);
						let relMoveToYTextValue = Number(commandRow.getCell("Y").v);

						let newX = convertUnits(relMoveToXTextValue, additionalUnitCoefficient);
						let newY = convertUnits(relMoveToYTextValue, additionalUnitCoefficient, 1, isInvertY);

						let relX = newX * shapeWidthInch;
						let relY = newY * shapeHeightInch;
						path.moveTo(relX, relY);
						lastPoint.x = relX;
						lastPoint.y = relY;
						break;
					}
					case "LineTo":
					{
						let lineToXTextValue = Number(commandRow.getCell("X").v);
						let lineToYTextValue = Number(commandRow.getCell("Y").v);

						let newX = convertUnits(lineToXTextValue, additionalUnitCoefficient);
						let newY = convertUnits(lineToYTextValue, additionalUnitCoefficient, shapeHeightInch, isInvertY);

						path.lnTo(newX, newY);
						lastPoint.x = newX;
						lastPoint.y = newY;
						break;
					}
					case "RelLineTo":
					{
						let relLineToXTextValue = Number(commandRow.getCell("X").v);
						let relLineToYTextValue = Number(commandRow.getCell("Y").v);

						let newX = convertUnits(relLineToXTextValue, additionalUnitCoefficient);
						let newY = convertUnits(relLineToYTextValue, additionalUnitCoefficient, 1, isInvertY);

						let newXRel = newX * shapeWidthInch;
						let newYRel = newY * shapeHeightInch;
						path.lnTo(newXRel, newYRel);
						lastPoint.x = newXRel;
						lastPoint.y = newYRel;
						break;
					}
					case "EllipticalArcTo":
					{
						// https://learn.microsoft.com/en-us/office/client-developer/visio/ellipticalarcto-row-geometry-section
						let x = Number(commandRow.getCell("X").v);
						let y = Number(commandRow.getCell("Y").v);
						let a = Number(commandRow.getCell("A").v);
						let b = Number(commandRow.getCell("B").v);
						let c = Number(commandRow.getCell("C").v);
						let d = Number(commandRow.getCell("D").v);

						let newX = convertUnits(x, additionalUnitCoefficient);
						let newY = convertUnits(y, additionalUnitCoefficient, shapeHeightInch, isInvertY);
						let newA = convertUnits(a, additionalUnitCoefficient);
						let newB = convertUnits(b, additionalUnitCoefficient, shapeHeightInch, isInvertY);
						let newC = isInvertY ? -c * radToC: c * radToC;
						let newD = d;

						// same but with a length in EMUs units and an angle in C-units, which will be expected clockwise
						// as in other sdkjs/common/Drawings/Format/Path.js functions.
						path.ellipticalArcTo(newX, newY, newA, newB, newC, newD);
						lastPoint.x = newX;
						lastPoint.y = newY;
						break;
					}
					case "Ellipse":
					{
						/**
						 * computes radii using center and two points on ellipse
						 * @param {number} cx
						 * @param {number} cy
						 * @param {number} x1
						 * @param {number} y1
						 * @param {number} x2
						 * @param {number} y2
						 * @return {{hR: number, wR: number} | false} radii
						 */
						function transformEllipseParams(cx, cy, x1, y1, x2, y2) {
							// subtract center from points
							// let rX1 = x1 - cx;
							// let rY1 = y1 - cy;
							// let rX2 = x2 - cx;
							// let rY2 = y2 - cy;

							// passing two points to (x1/a)^2 + (y1/b)^2 = 1 and (x2/a)^2 + (y2/b)^2 = 1 ellipse equations
							// we can wind radii: a and b values;
							// we can write it like below
							// let b = Math.sqrt((rX2*rX2*rY1*rY1-rY2*rY2*rX1*rX1)/(rX2*rX2-rX1*rX1));
							// let a = Math.sqrt(rX1*rX1*b*b/(b*b-rY1*rY1));
							// it is not useful I guess bcs ellipse is rotated so we need another equation

							// console.log('For ellipse with relative center (', cx, ', ', cy, ')');
							// console.log('point 1: (', x1, ', ', y1, '), point 2: (', x2, ', ', y2, ')');

							let rx = Math.hypot(x1 - cx, y1 - cy);
							let ry = Math.hypot(x2 - cx, y2 - cy);

							if ((x1 !== cx && y1 !== cy) || (x2 !== cx && y2 !== cy)) {
								// if some of points is not on the same vertical or horizontal as ellipse
								// ellipse command for rotated ellipse is not yet realized
								return false;
							}

							return {wR: rx, hR: ry};
						}

						let centerPointXTextValue = Number(commandRow.getCell("X").v);
						let centerPointYTextValue = Number(commandRow.getCell("Y").v);
						let somePointXTextValue = Number(commandRow.getCell("A").v);
						let somePointYTextValue = Number(commandRow.getCell("B").v);
						let anotherPointXTextValue = Number(commandRow.getCell("C").v);
						let anotherPointYTextValue = Number(commandRow.getCell("D").v);

						let newX = convertUnits(centerPointXTextValue, additionalUnitCoefficient);
						let newY = convertUnits(centerPointYTextValue, additionalUnitCoefficient, shapeHeightInch, isInvertY);
						let newA = convertUnits(somePointXTextValue, additionalUnitCoefficient);
						let newB = convertUnits(somePointYTextValue, additionalUnitCoefficient, shapeHeightInch, isInvertY);
						let newC = convertUnits(anotherPointXTextValue, additionalUnitCoefficient);
						let newD = convertUnits(anotherPointYTextValue, additionalUnitCoefficient, shapeHeightInch, isInvertY);

						let wRhR = transformEllipseParams(newX, newY, newA, newB, newC, newD);
						if (!wRhR) {
							console.log('Ellipse command for rotated ellipse is not yet realized');
						}
						// start to draw from ellipse right point

						// Check [MS-VSDX]-220215 2.2.3.2.2.Geometry Path
						// ellipse command implies moveTo
						path.moveTo(newX + wRhR.wR, newY);
						path.arcTo(wRhR.wR, wRhR.hR, 0, 180 * degToC);
						path.arcTo(wRhR.wR, wRhR.hR, 180 * degToC, 180 * degToC);
						// If the Row_Type element is of type Ellipse or InfiniteLine, it specifies the only segment of the path.
						path.moveTo(lastPoint.x, lastPoint.y);
						// lastPoint.x = newX;
						// lastPoint.y = newY;
						break;
					}
					case "ArcTo":
					{
						// https://learn.microsoft.com/en-us/office/client-developer/visio/arcto-row-geometry-section
						// circular arc

						// middleGap = a. can be negative which leads to opposite arc direction clockwise or anti-clockwise

						let x = Number(commandRow.getCell("X").v);					// xEnd
						let y = Number(commandRow.getCell("Y").v);					// yEnd
						let a = Number(commandRow.getCell("A").v);					// middleGap

						let newX = convertUnits(x, additionalUnitCoefficient);
						let newY = convertUnits(y, additionalUnitCoefficient, shapeHeightInch, isInvertY);
						let newA = convertUnits(a, additionalUnitCoefficient);

						// transform params for ellipticalArcTo
						let chordVector = {x: newX - lastPoint.x, y: newY - lastPoint.y };
						let chordVectorAngle = Math.atan2(chordVector.y, chordVector.x);
						let gapVectorAngle = chordVectorAngle - Math.PI / 2; // perpendicular clock wise
						let gapVector = {x: newA * Math.cos(gapVectorAngle), y: newA * Math.sin(gapVectorAngle)};
						let chordCenter = {x: chordVector.x / 2 + lastPoint.x, y: chordVector.y / 2 + lastPoint.y};
						let controlPoint = {x: chordCenter.x + gapVector.x, y: chordCenter.y + gapVector.y};

						if (a === 0) {
							// in fact it is line is a - arc gap = 0
							// ellipticalArcTo could catch cases line these but
							// there inaccuracy comes
							path.lnTo(newX, newY);
							console.log("tranform ellipticalArcTo to line",
								newX, newY, controlPoint.x, controlPoint.y, 0, 1);
							// path.ellipticalArcTo(newX, newY, controlPoint.x, controlPoint.y, 0, 1);
						} else  {
							path.ellipticalArcTo(newX, newY, controlPoint.x, controlPoint.y, 0, 1);
						}

						lastPoint.x = newX;
						lastPoint.y = newY;
						break;
					}
					case "PolylineTo":
					{
						// https://learn.microsoft.com/en-us/office/client-developer/visio/polylineto-row-geometry-section
						let x = Number(commandRow.getCell("X").v);
						let y = Number(commandRow.getCell("Y").v);
						// formula: knotLast, degree, xType, yType, x1, y1, x2, y2, ...
						let formula = String(commandRow.getCell("A").v).trim();
						let formulaValues = formula.substring(9, formula.length - 1).split(",");

						//Convert units to EMUs
						let xEndPointNew = convertUnits(x, additionalUnitCoefficient);
						let yEndPointNew = convertUnits(y, additionalUnitCoefficient, shapeHeightInch, isInvertY);
						for (let k = 2; k < formulaValues.length; k++) {
							// convert x and y
							formulaValues[k] = (k + 1) % 2 === 0 ?
								convertUnits(Number(formulaValues[k]), additionalUnitCoefficient, shapeHeightInch, isInvertY) :
								convertUnits(Number(formulaValues[k]), additionalUnitCoefficient);
						}

						let xType = parseInt(formulaValues[0]);
						let yType = parseInt(formulaValues[1]);

						let xScale = 1;
						let yScale = 1;

						if (xType === 0)
							xScale = shapeWidthInch;
						if (yType === 0)
							yScale = shapeHeightInch;

						// scale x and y and draw line
						let groupsCount = (formulaValues.length - 2) / 2;
						for (let j = 0; j < groupsCount; j++) {
							let pointX = Number(formulaValues[2 + j * 2]);
							let pointY = Number(formulaValues[2 + j * 2 + 1]);

							// scale only in formula
							let scaledX = pointX * xScale;
							let scaledY = pointY * yScale;

							path.lnTo(scaledX, scaledY);
						}

						// then go to x y from command args
						path.lnTo(xEndPointNew, yEndPointNew);

						lastPoint.x = xEndPointNew;
						lastPoint.y = yEndPointNew;
						break;
					}
					case "NURBSTo":
					{
						// https://learn.microsoft.com/en-us/office/client-developer/visio/nurbsto-row-geometry-section
						let xEndPoint = Number(commandRow.getCell("X").v);
						let yEndPoint = Number(commandRow.getCell("Y").v);
						let preLastKnot = Number(commandRow.getCell("A").v);
						let lastWeight = Number(commandRow.getCell("B").v);
						let firstKnot = Number(commandRow.getCell("C").v);
						let firstWeight = Number(commandRow.getCell("D").v);
						// NURBS formula: knotLast, degree, xType, yType, x1, y1, knot1, weight1, x2, y2, knot2, weight2, ...
						let formula = String(commandRow.getCell("E").v).trim();
						let formulaValues = formula.substring(6, formula.length - 1).split(",");

						//Convert units to EMUs
						let xEndPointNew = convertUnits(xEndPoint, additionalUnitCoefficient);
						let yEndPointNew = convertUnits(yEndPoint, additionalUnitCoefficient, shapeHeightInch, isInvertY);
						for (let k = 4; k < formulaValues.length; k++) {
							if (k % 4 == 0 || k % 4 == 1) {
								// convert x and y
								formulaValues[k] = k % 4 == 0 ? convertUnits(Number(formulaValues[k]), additionalUnitCoefficient) :
									convertUnits(Number(formulaValues[k]), additionalUnitCoefficient, shapeHeightInch, isInvertY);
							}
						}

						let prevLastX = lastPoint.x;
						let prevLastY = lastPoint.y;

						//Parse arguments
						let lastKnot = Number(formulaValues[0]);
						let degree = Number(formulaValues[1]);
						let xType =	parseInt(formulaValues[2]);
						let yType = parseInt(formulaValues[3]);

						let xScale = 1;
						let yScale = 1;

						if (xType === 0)
							xScale = shapeWidthInch;
						if (yType === 0)
							yScale = shapeHeightInch;

						/** @type {{x: Number, y: Number}[]} */
						let controlPoints = [];
						/** @type {Number[]} */
						let weights = [];
						/** @type {Number[]} */
						let knots = [];

						knots.push(firstKnot);
						weights.push(firstWeight);
						controlPoints.push({x: prevLastX, y: prevLastY});

						// point + knot groups
						let groupsCount = (formulaValues.length - 4) / 4;
						for (let j = 0; j < groupsCount; j++) {
							let controlPointX = Number(formulaValues[4 + j * 4]);
							let controlPointY = Number(formulaValues[4 + j * 4 + 1]);
							let knot = Number(formulaValues[4 + j * 4 + 2]);
							let weight = Number(formulaValues[4 + j * 4 + 3]);

							// scale only in formula
							let scaledX = controlPointX * xScale;
							let scaledY = controlPointY * yScale;

							controlPoints.push({x: scaledX, y: scaledY});
							knots.push(knot);
							weights.push(weight);
						}

						knots.push(preLastKnot);
						knots.push(lastKnot);
						// add 3 more knots for 3 degree NURBS to clamp curve at end point
						// a clamped knot vector must have `degree + 1` equal knots
						for (let j = 0; j < degree; j++) {
							knots.push(lastKnot);
						}
						weights.push(lastWeight);
						controlPoints.push({x: xEndPointNew, y: yEndPointNew});

						path.nurbsTo(controlPoints, weights, knots, degree);

						lastPoint.x = xEndPointNew;
						lastPoint.y = yEndPointNew;
						break;
					}
					case "SplineStart":
					{
						// https://learn.microsoft.com/en-us/office/client-developer/visio/splinestart-row-geometry-section
						splineStartCommandData = {
							firstControlPointX : lastPoint.x,
							firstControlPointY: lastPoint.y,
							secondControlPointX: convertUnits(Number(commandRow.getCell("X").v),
								additionalUnitCoefficient),
							secondControlPointY: convertUnits(Number(commandRow.getCell("Y").v),
								additionalUnitCoefficient),
							secondKnot: Number(commandRow.getCell("A").v),
							firstKnot: Number(commandRow.getCell("B").v),
							lastKnot: Number(commandRow.getCell("C").v),
							degree: Number(commandRow.getCell("D").v)
						};
						break;
					}
					case "SplineKnot":
					{
						// https://learn.microsoft.com/en-us/office/client-developer/visio/splineknot-row-geometry-section
						splineKnotCommandsData.push({
							controlPointX: convertUnits(Number(commandRow.getCell("X").v),
								additionalUnitCoefficient),
							controlPointY: convertUnits(Number(commandRow.getCell("Y").v),
								additionalUnitCoefficient),
							knot: Number(commandRow.getCell("A").v)
						});
						break;
					}
					case "InfiniteLine":
					{
						// https://learn.microsoft.com/en-us/office/client-developer/visio/infiniteline-row-geometry-section
						let x = Number(commandRow.getCell("X").v);
						let y = Number(commandRow.getCell("Y").v);
						let a = Number(commandRow.getCell("A").v);
						let b = Number(commandRow.getCell("B").v);

						let xNew = convertUnits(x, additionalUnitCoefficient);
						let yNew = convertUnits(y, additionalUnitCoefficient, shapeHeightInch, isInvertY);
						let aNew = convertUnits(a, additionalUnitCoefficient);
						let bNew = convertUnits(b, additionalUnitCoefficient, shapeHeightInch, isInvertY);

						let maxValue = 10000000000;
						if (xNew === aNew) {
							path.moveTo(xNew, -maxValue);
							path.lnTo(xNew, maxValue);
						} else if (yNew === bNew) {
							path.moveTo(-maxValue, yNew);
							path.lnTo(maxValue, yNew);
						} else {
							// visio doesnt draw diagonal infinite lines
							console.log("visio doesnt draw diagonal infinite lines");
						}
						// don't set last point here bcs it is always the only one element in geometry
						break;
					}
					case "RelCubBezTo":
					{
						// https://learn.microsoft.com/en-us/office/client-developer/visio/relcubbezto-row-geometry-section
						let x = Number(commandRow.getCell("X").v);
						let y = Number(commandRow.getCell("Y").v);
						let a = Number(commandRow.getCell("A").v);
						let b = Number(commandRow.getCell("B").v);
						let c = Number(commandRow.getCell("C").v);
						let d = Number(commandRow.getCell("D").v);

						let xNew = convertUnits(x, additionalUnitCoefficient) * shapeWidthInch;
						let yNew = convertUnits(y, additionalUnitCoefficient, 1, isInvertY) * shapeHeightInch;
						let aNew = convertUnits(a, additionalUnitCoefficient) * shapeWidthInch;
						let bNew = convertUnits(b, additionalUnitCoefficient, 1, isInvertY) * shapeHeightInch;
						let cNew = convertUnits(c, additionalUnitCoefficient) * shapeWidthInch;
						let dNew = convertUnits(d, additionalUnitCoefficient, 1, isInvertY) * shapeHeightInch;

						path.cubicBezTo(aNew, bNew, cNew, dNew, xNew, yNew);

						lastPoint.x = xNew;
						lastPoint.y = yNew;
						break;
					}
					case "RelEllipticalArcTo":
					{
						// https://learn.microsoft.com/en-us/office/client-developer/visio/relellipticalarcto-row-geometry-section
						let x = Number(commandRow.getCell("X").v);
						let y = Number(commandRow.getCell("Y").v);
						let a = Number(commandRow.getCell("A").v);
						let b = Number(commandRow.getCell("B").v);
						let c = Number(commandRow.getCell("C").v);
						let d = Number(commandRow.getCell("D").v);

						let newX = convertUnits(x, additionalUnitCoefficient) * shapeWidthInch;
						let newY = convertUnits(y, additionalUnitCoefficient, 1, isInvertY) * shapeHeightInch;
						let newA = convertUnits(a, additionalUnitCoefficient) * shapeWidthInch;
						let newB = convertUnits(b, additionalUnitCoefficient, 1, isInvertY) * shapeHeightInch;
						let newC = c * radToC;
						let newD = d;

						// same but with a length in EMUs units and an angle in C-units, which will be expected clockwise
						// as in other sdkjs/common/Drawings/Format/Path.js functions.
						path.ellipticalArcTo(newX, newY, newA, newB, newC, newD);
						lastPoint.x = newX;
						lastPoint.y = newY;
						break;
					}
					case "RelQuadBezTo":
					{
						// https://learn.microsoft.com/en-us/office/client-developer/visio/relquadbezto-row-geometry-section
						let x = Number(commandRow.getCell("X").v);
						let y = Number(commandRow.getCell("Y").v);
						let a = Number(commandRow.getCell("A").v);
						let b = Number(commandRow.getCell("B").v);

						let xNew = convertUnits(x, additionalUnitCoefficient) * shapeWidthInch;
						let yNew = convertUnits(y, additionalUnitCoefficient, 1, isInvertY) * shapeHeightInch;
						let aNew = convertUnits(a, additionalUnitCoefficient) * shapeWidthInch;
						let bNew = convertUnits(b, additionalUnitCoefficient, 1, isInvertY) * shapeHeightInch;

						path.quadBezTo(aNew, bNew, xNew, yNew);

						lastPoint.x = xNew;
						lastPoint.y = yNew;
						break;
					}
				}
				if (prevCommandName === "SplineKnot" &&
					(commandName !== "SplineKnot" || j === geometrySection.rows.length - 1) &&
					splineStartCommandData !== undefined) {
					// draw spline

					/** @type {{x: Number, y: Number}[]} */
					let controlPoints = [];
					/** @type {Number[]} */
					let knots = [];

					let degree = splineStartCommandData.degree;

					controlPoints.push({x: splineStartCommandData.firstControlPointX,
						y: splineStartCommandData.firstControlPointY});
					controlPoints.push({x: splineStartCommandData.secondControlPointX,
						y: splineStartCommandData.secondControlPointY});
					knots.push(splineStartCommandData.firstKnot);
					knots.push(splineStartCommandData.secondKnot);

					splineKnotCommandsData.forEach(function (splineKnotCommandData) {
						controlPoints.push({x: splineKnotCommandData.controlPointX, y: splineKnotCommandData.controlPointY});
						knots.push(splineKnotCommandData.knot);
					});

					knots.push(splineStartCommandData.lastKnot);
					// add 3 more knots for 3 degree NURBS to clamp curve at end point
					// a clamped knot vector must have `degree + 1` equal knots
					for (let j = 0; j < degree; j++) {
						knots.push(splineStartCommandData.lastKnot);
					}

					let weights = new Array(controlPoints.length).fill(1);

					path.nurbsTo(controlPoints, weights, knots, degree);

					lastPoint.x = controlPoints[controlPoints.length - 1].x;
					lastPoint.y = controlPoints[controlPoints.length - 1].y;
				}
				prevCommandName = commandName;
			}

			// path.close();

		}

		if (allFilledPathNoLineValuesEqual) {
			pathWithFill.setStroke(!filledPathNoLine);
		}

		if (allUnfilledPathNoLineValuesEqual) {
			pathWithoutFill.setStroke(!unfilledPathNoLine);
		}

		geometry.setPreset("Any");
		geometry.AddPath(pathWithFill);
		geometry.AddPath(pathWithoutFill);

		// TODO add connections
		// geometry.AddCnx('_3cd4', 'hc', 't');
		// geometry.AddCnx('cd2', 'l', 'vc');
		// geometry.AddCnx('cd4', 'hc', 'b');
		// geometry.AddCnx('0', 'r', 'vc');
		return geometry;
	}

	function getGeometryFromClass(shape) {
		// see ECMA-376-1_5th_edition and Geometry.js

		//TODO maybe get Zip so that we can find parts by relationships
		let master1shape1Geometry = getGeometryFromShape(shape)
		return master1shape1Geometry;
	}

	window['AscCommonDraw'].getGeometryFromShape = getGeometryFromShape;
	window['AscCommonDraw'].getGeometryFromClass = getGeometryFromClass;
})(window, window.document);
