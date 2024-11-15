/*
 * (c) Copyright Ascensio System SIA 2010-2024
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

(function(){

    let TEXT_ANNOT_STATE = {
        Marked:     0,
        Unmarked:   1,
        Accepted:   2,
        Rejected:   3,
        Cancelled:  4,
        Completed:  5,
        None:       6,
        Unknown:    7
    }

    let TEXT_ANNOT_STATE_MODEL = {
        Marked:     0,
        Review:     1,
        Unknown:    2
    }

    let NOTE_ICONS_TYPES = {
        Check1:         0,
        Check2:         1,
        Circle:         2,
        Comment:        3,
        Cross:          4,
        CrossH:         5,
        Help:           6,
        Insert:         7,
        Key:            8,
        NewParagraph:   9,
        Note:           10,
        Paragraph:      11,
        RightArrow:     12,
        RightPointer:   13,
        Star:           14,
        UpArrow:        15,
        UpLeftArrow:    16
    }

    /**
	 * Class representing a text annotation.
	 * @constructor
    */
    function CAnnotationText(sName, nPage, aOrigRect, oDoc)
    {
        AscPDF.CAnnotationBase.call(this, sName, AscPDF.ANNOTATIONS_TYPES.Text, nPage, aOrigRect, oDoc);

        this._noteIcon      = NOTE_ICONS_TYPES.Comment;
        this._point         = undefined;
        this._popupOpen     = false;
        this._popupRect     = undefined;
        this._richContents  = undefined;
        this._rotate        = undefined;
        this._state         = undefined;
        this._stateModel    = undefined;
        this._width         = undefined;
        this._fillColor     = [1, 0.82, 0];

        this._replies = [];
    }
    AscFormat.InitClass(CAnnotationText, AscPDF.CAnnotationBase, AscDFH.historyitem_type_Pdf_Annot_Text);
	CAnnotationText.prototype.constructor = CAnnotationText;
    
    CAnnotationText.prototype.SetState = function(nType) {
        this._state = nType;
    };
    CAnnotationText.prototype.GetState = function() {
        return this._state;
    };
    CAnnotationText.prototype.SetStateModel = function(nType) {
        this._stateModel = nType;
    };
    CAnnotationText.prototype.GetStateModel = function() {
        return this._stateModel;
    };
    CAnnotationText.prototype.ClearReplies = function() {
        this._replies = [];
    };
    CAnnotationText.prototype.AddReply = function(CommentData, nPos) {
        let oReply = new CAnnotationText(AscCommon.CreateGUID(), this.GetPage(), this.GetOrigRect().slice(), this.GetDocument());

        oReply.SetContents(CommentData.m_sText);
        oReply.SetCreationDate(CommentData.m_sOOTime);
        oReply.SetModDate(CommentData.m_sOOTime);
        oReply.SetAuthor(CommentData.m_sUserName);
        oReply.SetDisplay(window["AscPDF"].Api.Objects.display["visible"]);
        oReply.SetReplyTo(this.GetReplyTo() || this);
        CommentData.SetUserData(oReply.GetId());

        if (!nPos) {
            nPos = this._replies.length;
        }

        this._replies.splice(nPos, 0, oReply);
    };
    CAnnotationText.prototype.GetAscCommentData = function() {
        let oAscCommData = new Asc.asc_CCommentDataWord(null);
        if (null == this.GetContents()) {
            return undefined;
        }

        oAscCommData.asc_putText(this.GetContents());
        let sModDate = this.GetModDate();
        if (sModDate)
            oAscCommData.asc_putOnlyOfficeTime(sModDate.toString());
        oAscCommData.asc_putUserId(editor.documentUserId);
        oAscCommData.asc_putUserName(this.GetAuthor());
        
        let nState = this.GetState();
        let bSolved;
        if (nState == TEXT_ANNOT_STATE.Accepted || nState == TEXT_ANNOT_STATE.Completed)
            bSolved = true;
        oAscCommData.asc_putSolved(bSolved);
        oAscCommData.asc_putQuoteText("");
        oAscCommData.m_sUserData = this.GetId();

        this._replies.forEach(function(reply) {
            oAscCommData.m_aReplies.push(reply.GetAscCommentData());
        });

        return oAscCommData;
    };

    CAnnotationText.prototype.SetIconType = function(nType) {
        this._noteIcon = nType;
    };
    CAnnotationText.prototype.GetIconType = function() {
        return this._noteIcon;
    };
    CAnnotationText.prototype.GetIconDrawFunc = function() {
        let nType = this.GetIconType();
        switch (nType) {
            case NOTE_ICONS_TYPES.Check1:
            case NOTE_ICONS_TYPES.Check2:
                return drawIconCheck;
            case NOTE_ICONS_TYPES.Circle:
                return drawIconCircle;
            case NOTE_ICONS_TYPES.Comment:
                return drawIconComment;
            case NOTE_ICONS_TYPES.Cross:
                return drawIconCross;
            case NOTE_ICONS_TYPES.CrossH:
                return drawIconCrossHairs;
            case NOTE_ICONS_TYPES.Help:
                return drawIconHelp;
            case NOTE_ICONS_TYPES.Insert:
                return drawIconInsert;
            case NOTE_ICONS_TYPES.Key:
                return drawIconKey;
            case NOTE_ICONS_TYPES.NewParagraph:
                return drawIconNewParagraph;
            case NOTE_ICONS_TYPES.Note:
                return drawIconNote;
            case NOTE_ICONS_TYPES.Paragraph:
                return drawIconParagraph;
            case NOTE_ICONS_TYPES.RightArrow:
                return drawIconRightArrow;
            case NOTE_ICONS_TYPES.RightPointer:
                return drawIconRightPointer;
            case NOTE_ICONS_TYPES.Star:
                return drawIconStar;
            case NOTE_ICONS_TYPES.UpArrow:
                return drawIconUpArrow;
            case NOTE_ICONS_TYPES.UpLeftArrow:
                return drawIconUpLeftArrow;
        }

        return null;
    };
    CAnnotationText.prototype.LazyCopy = function() {
        let oDoc = this.GetDocument();
        oDoc.StartNoHistoryMode();

        let oNewAnnot = new CAnnotationText(AscCommon.CreateGUID(), this.GetPage(), this.GetOrigRect().slice(), oDoc);

        oNewAnnot.lazyCopy = true;
        oNewAnnot._originView = this._originView;
        oNewAnnot._apIdx = this._apIdx;

        let aFillColor = this.GetFillColor();
        aFillColor && oNewAnnot.SetFillColor(aFillColor.slice());
        oNewAnnot.SetOriginPage(this.GetOriginPage());
        oNewAnnot.SetAuthor(this.GetAuthor());
        oNewAnnot.SetModDate(this.GetModDate());
        oNewAnnot.SetCreationDate(this.GetCreationDate());
        oNewAnnot.SetContents(this.GetContents());
        oNewAnnot.SetIconType(this.GetIconType());

        oDoc.EndNoHistoryMode();

        return oNewAnnot;
    };
    CAnnotationText.prototype.Draw = function(oGraphics) {
        if (this.IsHidden() == true)
            return;

        // note: oGraphic параметр для рисование track
        if (!this.graphicObjects)
            this.graphicObjects = new AscFormat.DrawingObjectsController(this);

        let oRGB = this.GetRGBColor(this.GetFillColor());

        let oDoc        = this.GetDocument();
        let nPage       = this.GetPage();
        let aOrigRect   = this.GetOrigRect();
        let nRotAngle   = oDoc.Viewer.getPageRotate(nPage);
        
        let nX          = aOrigRect[0] + 0.5 >> 0;
        let nY          = aOrigRect[1] + 0.5 >> 0;
        let nWidth      = (aOrigRect[2] - aOrigRect[0]) / oDoc.Viewer.zoom;
        let nHeight     = (aOrigRect[3] - aOrigRect[1]) / oDoc.Viewer.zoom;
        
        let oCtx = oGraphics.GetContext();
        oCtx.save();
        oGraphics.EnableTransform();
        oCtx.iconFill = "rgb(" + oRGB.r + "," + oRGB.g + "," + oRGB.b + ")";

        let nScale = 1.25 / oDoc.Viewer.zoom;
        let drawFunc = this.GetIconDrawFunc();
        drawFunc(oCtx, nX , nY, nScale, nScale, -nRotAngle * Math.PI / 180);

        oCtx.restore();

        oGraphics.DrawLockObjectRect(this.Lock.Get_Type(), nX, nY, 20 / oDoc.Viewer.zoom, 20 / oDoc.Viewer.zoom);
        //// draw rect
        // oGraphics.SetLineWidth(1);
        // oGraphics.SetStrokeStyle(0, 255, 255);
        // oGraphics.SetLineDash([]);
        // oGraphics.BeginPath();
        // oGraphics.Rect(nX, nY, nWidth, nHeight);
        // oGraphics.Stroke();
    };
    CAnnotationText.prototype.drawLocks = function (transform, oGraphicsPDF) {
		if (AscCommon.IsShapeToImageConverter) {
			return;
		}
		var bNotes = !!(this.parent && this.parent.kind === AscFormat.TYPE_KIND.NOTES);
		if (!this.group && !bNotes) {
			var oLock;
			if (this.parent instanceof AscCommonWord.ParaDrawing) {
				oLock = this.parent.Lock;
			} else if (this.Lock) {
				oLock = this.Lock;
			}
			if (oLock && AscCommon.c_oAscLockTypes.kLockTypeNone !== oLock.Get_Type()) {
				var bCoMarksDraw = true;
				var oApi = editor || Asc['editor'];
				if (oApi) {

					switch (oApi.getEditorId()) {
						case AscCommon.c_oEditorId.Word: {
							bCoMarksDraw = (true === oApi.isCoMarksDraw || AscCommon.c_oAscLockTypes.kLockTypeMine !== oLock.Get_Type());
							break;
						}
						case AscCommon.c_oEditorId.Presentation: {
							bCoMarksDraw = (!AscCommon.CollaborativeEditing.Is_Fast() || AscCommon.c_oAscLockTypes.kLockTypeMine !== oLock.Get_Type());
							break;
						}
						case AscCommon.c_oEditorId.Spreadsheet: {
							bCoMarksDraw = (!oApi.collaborativeEditing.getFast() || AscCommon.c_oAscLockTypes.kLockTypeMine !== oLock.Get_Type());
							break;
						}
					}
				}
				if (bCoMarksDraw && oGraphicsPDF.DrawLockObjectRect) {
					oGraphicsPDF.transform3(transform);
					oGraphicsPDF.DrawLockObjectRect(oLock.Get_Type(), 0, 0, this.extX, this.extY);
					return true;
				}
			}
		}
		return false;
	};
    CAnnotationText.prototype.IsNeedDrawFromStream = function() {
        return false;
    };
    CAnnotationText.prototype.onMouseDown = function(x, y, e) {
        let oViewer         = Asc.editor.getDocumentRenderer();
        let oDrawingObjects = oViewer.DrawingObjects;

        this.selectStartPage = this.GetPage();

        let pageObject = oViewer.getPageByCoords2(x, y);
        if (!pageObject)
            return false;

        let X = pageObject.x;
        let Y = pageObject.y;

        oDrawingObjects.OnMouseDown(e, X, Y, pageObject.index);
    };
    CAnnotationText.prototype.IsComment = function() {
        return true;
    };
    
    CAnnotationText.prototype.WriteToBinary = function(memory) {
        memory.WriteByte(AscCommon.CommandType.ctAnnotField);

        let nStartPos = memory.GetCurPosition();
        memory.Skip(4);

        this.WriteToBinaryBase(memory);
        this.WriteToBinaryBase2(memory);
        
        // icon
        let nIconType = this.GetIconType();
        if (nIconType != null) {
            memory.annotFlags |= (1 << 16);
            memory.WriteByte(this.GetIconType());
        }
        
        // state model
        let nStateModel = this.GetStateModel();
        if (nStateModel != null) {
            memory.annotFlags |= (1 << 17);
            memory.WriteByte(nStateModel);
        }

        // state
        let nState = this.GetState();
        if (nState != null) {
            memory.annotFlags |= (1 << 18);
            memory.WriteByte(nState);
        }

        let nEndPos = memory.GetCurPosition();
        memory.Seek(memory.posForFlags);
        memory.WriteLong(memory.annotFlags);
        
        memory.Seek(nStartPos);
        memory.WriteLong(nEndPos - nStartPos);
        memory.Seek(nEndPos);
    };
    
    window["AscPDF"].CAnnotationText            = CAnnotationText;
    window["AscPDF"].TEXT_ANNOT_STATE           = TEXT_ANNOT_STATE;
    window["AscPDF"].TEXT_ANNOT_STATE_MODEL     = TEXT_ANNOT_STATE_MODEL;
	
    function drawIconCheck(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(2.238,6.8);
        ctx.lineTo(1,9.8);
        ctx.lineTo(4.714,14);
        ctx.bezierCurveTo(9.048,7.4,10.286,6.2,14,2);
        ctx.bezierCurveTo(11.524000000000001,2,6.778,6.8,4.714,9.8);
        ctx.lineTo(2.2380000000000004,6.800000000000001);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(9.536,5.147);
        ctx.bezierCurveTo(7.808999999999999,6.698,6.1339999999999995,8.619,5.1259999999999994,10.083);
        ctx.lineTo(4.749999999999999,10.629);
        ctx.lineTo(2.3819999999999992,7.760999999999999);
        ctx.lineTo(1.5819999999999992,9.702);
        ctx.lineTo(4.655999999999999,13.179);
        ctx.bezierCurveTo(8.244,7.748,9.668999999999999,6.122,12.439,3.005000000000001);
        ctx.bezierCurveTo(12.314,3.072000000000001,12.185,3.145000000000001,12.052,3.225000000000001);
        ctx.bezierCurveTo(11.263,3.700000000000001,10.399,4.372000000000001,9.536,5.147000000000001);
        ctx.closePath();
        ctx.moveTo(11.536,2.3680000000000003);
        ctx.bezierCurveTo(12.383,1.8580000000000003,13.241,1.5000000000000004,14,1.5000000000000004);
        ctx.lineTo(15.11,1.5000000000000004);
        ctx.lineTo(14.373999999999999,2.3310000000000004);
        ctx.bezierCurveTo(13.999999999999998,2.7550000000000003,13.650999999999998,3.1480000000000006,13.320999999999998,3.5180000000000007);
        ctx.bezierCurveTo(10.387999999999998,6.8180000000000005,9.011,8.368,5.131999999999998,14.274000000000001);
        ctx.lineTo(4.772999999999998,14.821000000000002);
        ctx.lineTo(0.419,9.898);
        ctx.lineTo(2.093,5.8389999999999995);
        ctx.lineTo(4.686,8.979);
        ctx.bezierCurveTo(5.75,7.54,7.289,5.822,8.867,4.404);
        ctx.bezierCurveTo(9.758000000000001,3.604,10.674000000000001,2.888,11.536000000000001,2.37);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
    function drawIconCircle(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(16,0);
        ctx.lineTo(16,16);
        ctx.lineTo(0,16);
        ctx.closePath();
        ctx.clip();
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(8,13);
        ctx.translate(8,8);
        ctx.rotate(0);
        ctx.arc(0,0,5,1.5707963267948966,4.71238898038469,1);
        ctx.rotate(0);
        ctx.translate(-8,-8);
        ctx.translate(8,8);
        ctx.rotate(0);
        ctx.arc(0,0,5,-1.5707963267948966,1.5707963267948966,1);
        ctx.rotate(0);
        ctx.translate(-8,-8);
        ctx.moveTo(8,15);
        ctx.translate(8,8);
        ctx.rotate(0);
        ctx.arc(0,0,7,1.5707963267948966,4.71238898038469,1);
        ctx.rotate(0);
        ctx.translate(-8,-8);
        ctx.translate(8,8);
        ctx.rotate(0);
        ctx.arc(0,0,7,-1.5707963267948966,1.5707963267948966,1);
        ctx.rotate(0);
        ctx.translate(-8,-8);
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(8,15);
        ctx.translate(8,8);
        ctx.rotate(0);
        ctx.arc(0,0,7,1.5707963267948966,4.71238898038469,1);
        ctx.rotate(0);
        ctx.translate(-8,-8);
        ctx.translate(8,8);
        ctx.rotate(0);
        ctx.arc(0,0,7,-1.5707963267948966,1.5707963267948966,1);
        ctx.rotate(0);
        ctx.translate(-8,-8);
        ctx.moveTo(8,16);
        ctx.translate(8,8);
        ctx.rotate(0);
        ctx.arc(0,0,8,1.5707963267948966,4.71238898038469,0);
        ctx.rotate(0);
        ctx.translate(-8,-8);
        ctx.translate(8,8);
        ctx.rotate(0);
        ctx.arc(0,0,8,-1.5707963267948966,1.5707963267948966,0);
        ctx.rotate(0);
        ctx.translate(-8,-8);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(8,12);
        ctx.translate(8,8);
        ctx.rotate(0);
        ctx.arc(0,0,4,1.5707963267948966,4.71238898038469,1);
        ctx.rotate(0);
        ctx.translate(-8,-8);
        ctx.translate(8,8);
        ctx.rotate(0);
        ctx.arc(0,0,4,-1.5707963267948966,1.5707963267948966,1);
        ctx.rotate(0);
        ctx.translate(-8,-8);
        ctx.moveTo(8,13);
        ctx.translate(8,8);
        ctx.rotate(0);
        ctx.arc(0,0,5,1.5707963267948966,4.71238898038469,0);
        ctx.rotate(0);
        ctx.translate(-8,-8);
        ctx.translate(8,8);
        ctx.rotate(0);
        ctx.arc(0,0,5,-1.5707963267948966,1.5707963267948966,0);
        ctx.rotate(0);
        ctx.translate(-8,-8);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();

        ctx.restore();
    }
    function drawIconComment(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(1,2);
        ctx.lineTo(15,2);
        ctx.lineTo(15,12);
        ctx.lineTo(7.5,12.5);
        ctx.lineTo(5.5,14.5);
        ctx.lineTo(3.5,12.5);
        ctx.lineTo(1,12);
        ctx.lineTo(1,2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(3,4);
        ctx.lineTo(13,4);
        ctx.lineTo(13,5);
        ctx.lineTo(3,5);
        ctx.lineTo(3,4);
        ctx.closePath();
        ctx.moveTo(3,6);
        ctx.lineTo(13,6);
        ctx.lineTo(13,7);
        ctx.lineTo(3,7);
        ctx.lineTo(3,6);
        ctx.closePath();
        ctx.moveTo(10,8);
        ctx.lineTo(3,8);
        ctx.lineTo(3,9);
        ctx.lineTo(10,9);
        ctx.lineTo(10,8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(3,13);
        ctx.lineTo(5.5,15.5);
        ctx.lineTo(8,13);
        ctx.lineTo(15,13);
        ctx.translate(15,12);
        ctx.rotate(0);
        ctx.arc(0,0,1,1.5707963267948966,0,1);
        ctx.rotate(0);
        ctx.translate(-15,-12);
        ctx.lineTo(16,2);
        ctx.translate(15,2);
        ctx.rotate(0);
        ctx.arc(0,0,1,0,-1.5707963267948966,1);
        ctx.rotate(0);
        ctx.translate(-15,-2);
        ctx.lineTo(1,1);
        ctx.translate(1,2);
        ctx.rotate(0);
        ctx.arc(0,0,1,-1.5707963267948966,-3.141592653589793,1);
        ctx.rotate(0);
        ctx.translate(-1,-2);
        ctx.lineTo(0,12);
        ctx.translate(1,12);
        ctx.rotate(0);
        ctx.arc(0,0,1,3.141592653589793,1.5707963267948966,1);
        ctx.rotate(0);
        ctx.translate(-1,-12);
        ctx.lineTo(3,13);
        ctx.closePath();
        ctx.moveTo(5.5,14.086);
        ctx.lineTo(3.414,12);
        ctx.lineTo(1,12);
        ctx.lineTo(1,2);
        ctx.lineTo(15,2);
        ctx.lineTo(15,12);
        ctx.lineTo(7.586,12);
        ctx.lineTo(5.5,14.086);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
    function drawIconCross(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(3.404,2.697);
        ctx.lineTo(2.697,3.404);
        ctx.lineTo(7.293,8);
        ctx.lineTo(2.697,12.596);
        ctx.lineTo(3.404,13.303);
        ctx.lineTo(8,8.707);
        ctx.lineTo(12.596,13.303);
        ctx.lineTo(13.303,12.596);
        ctx.lineTo(8.707,8);
        ctx.lineTo(13.303,3.404);
        ctx.lineTo(12.596,2.697);
        ctx.lineTo(8,7.293);
        ctx.lineTo(3.404,2.697);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(1.282,3.404);
        ctx.lineTo(3.404,1.282);
        ctx.lineTo(8,5.88);
        ctx.lineTo(12.596,1.2829999999999995);
        ctx.lineTo(14.717,3.4049999999999994);
        ctx.lineTo(10.121,8);
        ctx.lineTo(14.717,12.596);
        ctx.lineTo(12.597000000000001,14.717);
        ctx.lineTo(8,10.121);
        ctx.lineTo(3.404,14.717);
        ctx.lineTo(1.282,12.597000000000001);
        ctx.lineTo(5.88,8);
        ctx.lineTo(1.282,3.404);
        ctx.closePath();
        ctx.moveTo(2.697,3.404);
        ctx.lineTo(7.293,8);
        ctx.lineTo(2.697,12.596);
        ctx.lineTo(3.404,13.303);
        ctx.lineTo(8,8.707);
        ctx.lineTo(12.596,13.303);
        ctx.lineTo(13.303,12.596);
        ctx.lineTo(8.707,8);
        ctx.lineTo(13.303,3.404);
        ctx.lineTo(12.596,2.697);
        ctx.lineTo(8,7.293);
        ctx.lineTo(3.404,2.697);
        ctx.lineTo(2.697,3.404);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
    function drawIconCrossHairs(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(6,6);
        ctx.lineTo(6,4);
        ctx.lineTo(9,4);
        ctx.lineTo(9,6);
        ctx.lineTo(11,6);
        ctx.lineTo(11,9);
        ctx.lineTo(9,9);
        ctx.lineTo(9,11);
        ctx.lineTo(6,11);
        ctx.lineTo(6,9);
        ctx.lineTo(4,9);
        ctx.lineTo(4,6);
        ctx.lineTo(6,6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(14,7.5);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,6.5,0,3.141592653589793,0);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,6.5,3.141592653589793,6.283185307179586,0);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.moveTo(13,7.5);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,5.5,0,3.141592653589793,0);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,5.5,3.141592653589793,6.283185307179586,0);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(6,11);
        ctx.lineTo(6,9);
        ctx.lineTo(4,9);
        ctx.lineTo(4,6);
        ctx.lineTo(6,6);
        ctx.lineTo(6,4);
        ctx.lineTo(9,4);
        ctx.lineTo(9,6);
        ctx.lineTo(11,6);
        ctx.lineTo(11,9);
        ctx.lineTo(9,9);
        ctx.lineTo(9,11);
        ctx.lineTo(6,11);
        ctx.closePath();
        ctx.moveTo(7,8);
        ctx.lineTo(5,8);
        ctx.lineTo(5,7);
        ctx.lineTo(7,7);
        ctx.lineTo(7,5);
        ctx.lineTo(8,5);
        ctx.lineTo(8,7);
        ctx.lineTo(10,7);
        ctx.lineTo(10,8);
        ctx.lineTo(8,8);
        ctx.lineTo(8,10);
        ctx.lineTo(7,10);
        ctx.lineTo(7,8);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(7.5,13);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,5.5,1.5707963267948966,4.71238898038469,1);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,5.5,-1.5707963267948966,1.5707963267948966,1);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.moveTo(7.5,12);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,4.5,1.5707963267948966,4.71238898038469,1);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,4.5,-1.5707963267948966,1.5707963267948966,1);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(7.5,15);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,7.5,1.5707963267948966,4.71238898038469,1);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,7.5,-1.5707963267948966,1.5707963267948966,1);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.moveTo(7.5,14);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,6.5,1.5707963267948966,4.71238898038469,1);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,6.5,-1.5707963267948966,1.5707963267948966,1);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
    function drawIconHelp(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(15,7.5);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,7.5,0,3.141592653589793,0);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,7.5,3.141592653589793,6.283185307179586,0);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(8,11);
        ctx.lineTo(8,10);
        ctx.lineTo(7,10);
        ctx.lineTo(7,11);
        ctx.lineTo(8,11);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(15,7.5);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,7.5,0,3.141592653589793,0);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,7.5,3.141592653589793,6.283185307179586,0);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.moveTo(14,7.5);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,6.5,0,3.141592653589793,1);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.translate(7.5,7.5);
        ctx.rotate(0);
        ctx.arc(0,0,6.5,3.141592653589793,6.283185307179586,1);
        ctx.rotate(0);
        ctx.translate(-7.5,-7.5);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(7.207,4);
        ctx.translate(7.207000000000001,5.207000000000001);
        ctx.rotate(0);
        ctx.arc(0,0,1.207,-1.5707963267948968,-3.141592653589793,1);
        ctx.rotate(0);
        ctx.translate(-7.207000000000001,-5.207000000000001);
        ctx.lineTo(6,5.5);
        ctx.lineTo(5,5.5);
        ctx.lineTo(5,5.207);
        ctx.translate(7.207000000000001,5.207000000000001);
        ctx.rotate(0);
        ctx.arc(0,0,2.207,3.141592653589793,4.71238898038469,0);
        ctx.rotate(0);
        ctx.translate(-7.207000000000001,-5.207000000000001);
        ctx.lineTo(7.793,3);
        ctx.translate(7.792999999999999,5.207000000000001);
        ctx.rotate(0);
        ctx.arc(0,0,2.207,-1.5707963267948966,0,0);
        ctx.rotate(0);
        ctx.translate(-7.792999999999999,-5.207000000000001);
        ctx.lineTo(10,5.5);
        ctx.translate(7.5,5.5);
        ctx.rotate(0);
        ctx.arc(0,0,2.5,0,0.9272952180016123,0);
        ctx.rotate(0);
        ctx.translate(-7.5,-5.5);
        ctx.lineTo(8.6,7.8);
        ctx.translate(9.5,9);
        ctx.rotate(0);
        ctx.arc(0,0,1.5,-2.2142974355881813,-3.1415926535897936,1);
        ctx.rotate(0);
        ctx.translate(-9.5,-9);
        ctx.lineTo(7,9);
        ctx.translate(9.5,9);
        ctx.rotate(0);
        ctx.arc(0,0,2.5,3.141592653589793,4.068887871591405,0);
        ctx.rotate(0);
        ctx.translate(-9.5,-9);
        ctx.lineTo(8.4,6.7);
        ctx.translate(7.499999999999999,5.5);
        ctx.rotate(0);
        ctx.arc(0,0,1.5,0.927295218001612,-3.3306690738754696e-16,1);
        ctx.rotate(0);
        ctx.translate(-7.499999999999999,-5.5);
        ctx.lineTo(9,5.207);
        ctx.translate(7.792999999999999,5.207000000000001);
        ctx.rotate(0);
        ctx.arc(0,0,1.207,0,-1.5707963267948963,1);
        ctx.rotate(0);
        ctx.translate(-7.792999999999999,-5.207000000000001);
        ctx.lineTo(7.207,4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
    function drawIconInsert(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(7.5,1);
        ctx.lineTo(0.5,14);
        ctx.lineTo(15.5,14);
        ctx.lineTo(7.5,1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(7.5,3);
        ctx.lineTo(13.687000000000001,13);
        ctx.lineTo(2.313,13);
        ctx.lineTo(7.5,3);
        ctx.closePath();
        ctx.moveTo(7.5,1);
        ctx.lineTo(0.5,14);
        ctx.lineTo(15.5,14);
        ctx.lineTo(7.5,1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
    function drawIconKey(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(10,11);
        ctx.translate(9.998041619289044,6.000000383525516);
        ctx.rotate(0);
        ctx.arc(0,0,5,1.570404650642691,2.7940377548872117,1);
        ctx.rotate(0);
        ctx.translate(-9.998041619289044,-6.000000383525516);
        ctx.lineTo(0.5,12.5);
        ctx.lineTo(3.5,15.5);
        ctx.lineTo(4,15);
        ctx.lineTo(4,14);
        ctx.lineTo(5,14);
        ctx.lineTo(5,13);
        ctx.lineTo(6,13);
        ctx.lineTo(6,12);
        ctx.lineTo(7,12);
        ctx.lineTo(8.297,10.703);
        ctx.translate(9.992847608690775,6.010005125924621);
        ctx.rotate(0);
        ctx.arc(0,0,4.99,1.9175528974671896,1.5693629813523524,1);
        ctx.rotate(0);
        ctx.translate(-9.992847608690775,-6.010005125924621);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(6.454,7.96);
        ctx.lineTo(1.9139999999999997,12.5);
        ctx.lineTo(3,13.586);
        ctx.lineTo(3,13);
        ctx.lineTo(4,13);
        ctx.lineTo(4,12);
        ctx.lineTo(5,12);
        ctx.lineTo(5,11);
        ctx.lineTo(6.586,11);
        ctx.lineTo(8.04,9.546);
        ctx.lineTo(8.638,9.761999999999999);
        ctx.translate(9.99924969497314,6.000750305026858);
        ctx.rotate(0);
        ctx.arc(0,0,4,1.9180454596081746,2.7943435207765153,1);
        ctx.rotate(0);
        ctx.translate(-9.99924969497314,-6.000750305026858);
        ctx.lineTo(6.454,7.959999999999998);
        ctx.closePath();
        ctx.moveTo(7,12);
        ctx.lineTo(6,12);
        ctx.lineTo(6,13);
        ctx.lineTo(5,13);
        ctx.lineTo(5,14);
        ctx.lineTo(4,14);
        ctx.lineTo(4,15);
        ctx.lineTo(3.5,15.5);
        ctx.lineTo(0.5,12.5);
        ctx.lineTo(5.297,7.703);
        ctx.translate(9.998562118716425,6.001437881283573);
        ctx.rotate(0);
        ctx.arc(0,0,5,2.7943435207765153,1.9180454596081749,0);
        ctx.rotate(0);
        ctx.translate(-9.998562118716425,-6.001437881283573);
        ctx.lineTo(7,12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(12,5);
        ctx.translate(11,5);
        ctx.rotate(0);
        ctx.arc(0,0,1,0,3.141592653589793,0);
        ctx.rotate(0);
        ctx.translate(-11,-5);
        ctx.translate(11,5);
        ctx.rotate(0);
        ctx.arc(0,0,1,3.141592653589793,6.283185307179586,0);
        ctx.rotate(0);
        ctx.translate(-11,-5);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
    function drawIconNewParagraph(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(16,0);
        ctx.lineTo(16,16);
        ctx.lineTo(0,16);
        ctx.closePath();
        ctx.clip();
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(1,6.464);
        ctx.translate(1.9999999430613173,6.4643374572001395);
        ctx.rotate(0);
        ctx.arc(0,0,1,-3.1412551963833595,-2.273128847087377,0);
        ctx.rotate(0);
        ctx.translate(-1.9999999430613173,-6.4643374572001395);
        ctx.lineTo(6.854,1.0470000000000006);
        ctx.translate(7.5,1.8103374090138649);
        ctx.rotate(0);
        ctx.arc(0,0,1,-2.273128921679027,-0.8684637319107662,0);
        ctx.rotate(0);
        ctx.translate(-7.5,-1.8103374090138649);
        ctx.lineTo(13.646,5.7010000000000005);
        ctx.translate(13.000000056938683,6.4643374572001395);
        ctx.rotate(0);
        ctx.arc(0,0,1,-0.8684638065025254,-0.0003374572065435455,0);
        ctx.rotate(0);
        ctx.translate(-13.000000056938683,-6.4643374572001395);
        ctx.lineTo(14,15);
        ctx.translate(13,15);
        ctx.rotate(0);
        ctx.arc(0,0,1,0,1.5707963267948966,0);
        ctx.rotate(0);
        ctx.translate(-13,-15);
        ctx.lineTo(2,16);
        ctx.translate(2,15);
        ctx.rotate(0);
        ctx.arc(0,0,1,1.5707963267948966,3.141592653589793,0);
        ctx.rotate(0);
        ctx.translate(-2,-15);
        ctx.lineTo(1,6.464);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(2,5.464);
        ctx.lineTo(7.5,1);
        ctx.lineTo(13,5.464);
        ctx.lineTo(13,15);
        ctx.lineTo(2,15);
        ctx.lineTo(2,5.464);
        ctx.closePath();
        ctx.moveTo(1.354,4.7);
        ctx.translate(1.9999997806095724,5.463337594680352);
        ctx.rotate(0);
        ctx.arc(0,0,1,-2.2731286342695554,-3.1422550589578835,1);
        ctx.rotate(0);
        ctx.translate(-1.9999997806095724,-5.463337594680352);
        ctx.lineTo(1,15);
        ctx.translate(2,15);
        ctx.rotate(0);
        ctx.arc(0,0,1,3.141592653589793,1.5707963267948966,1);
        ctx.rotate(0);
        ctx.translate(-2,-15);
        ctx.lineTo(13,16);
        ctx.translate(13,15);
        ctx.rotate(0);
        ctx.arc(0,0,1,1.5707963267948966,0,1);
        ctx.rotate(0);
        ctx.translate(-13,-15);
        ctx.lineTo(14,5.464);
        ctx.translate(13.000000056938683,5.4643374572001395);
        ctx.rotate(0);
        ctx.arc(0,0,1,-0.0003374572064335634,-0.8684638065024154,1);
        ctx.rotate(0);
        ctx.translate(-13.000000056938683,-5.4643374572001395);
        ctx.lineTo(8.146,0.237);
        ctx.translate(7.500000000000001,1.0003374090138646);
        ctx.rotate(0);
        ctx.arc(0,0,1,-0.8684637319107666,-2.2731289216790262,1);
        ctx.rotate(0);
        ctx.translate(-7.500000000000001,-1.0003374090138646);
        ctx.lineTo(1.354,4.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(6.5,6);
        ctx.bezierCurveTo(5.12,6,4,6.654,4,8);
        ctx.bezierCurveTo(4,9.139,5.12,10,6.5,10);
        ctx.lineTo(7,10);
        ctx.lineTo(7,14);
        ctx.lineTo(8,14);
        ctx.lineTo(8,7);
        ctx.lineTo(9,7);
        ctx.lineTo(9,14);
        ctx.lineTo(10,14);
        ctx.lineTo(10,7);
        ctx.lineTo(11,7);
        ctx.lineTo(11,6);
        ctx.lineTo(6.5,6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();

        ctx.restore();
    }
    function drawIconNote(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(1,2);
        ctx.translate(2,2);
        ctx.rotate(0);
        ctx.arc(0,0,1,3.141592653589793,4.71238898038469,0);
        ctx.rotate(0);
        ctx.translate(-2,-2);
        ctx.lineTo(14,1);
        ctx.translate(14,2);
        ctx.rotate(0);
        ctx.arc(0,0,1,-1.5707963267948966,0,0);
        ctx.rotate(0);
        ctx.translate(-14,-2);
        ctx.lineTo(15,11.086);
        ctx.translate(14.00000002280587,11.085786430950666);
        ctx.rotate(0);
        ctx.arc(0,0,1,0.00021356905077231963,0.785549195647058,0);
        ctx.rotate(0);
        ctx.translate(-14.00000002280587,-11.085786430950666);
        ctx.lineTo(11.793000000000001,14.707);
        ctx.translate(11.085786430950666,14.00000002280587);
        ctx.rotate(0);
        ctx.arc(0,0,1,0.7852471311476532,1.570582757743939,0);
        ctx.rotate(0);
        ctx.translate(-11.085786430950666,-14.00000002280587);
        ctx.lineTo(2,15);
        ctx.translate(2,14);
        ctx.rotate(0);
        ctx.arc(0,0,1,1.5707963267948966,3.141592653589793,0);
        ctx.rotate(0);
        ctx.translate(-2,-14);
        ctx.lineTo(1,2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(14,2);
        ctx.lineTo(14,11);
        ctx.lineTo(12,11);
        ctx.translate(12,12);
        ctx.rotate(0);
        ctx.arc(0,0,1,-1.5707963267948966,-3.141592653589793,1);
        ctx.rotate(0);
        ctx.translate(-12,-12);
        ctx.lineTo(11,14);
        ctx.lineTo(2,14);
        ctx.lineTo(2,2);
        ctx.lineTo(14,2);
        ctx.closePath();
        ctx.moveTo(13.586,12);
        ctx.lineTo(12,13.586);
        ctx.lineTo(12,12);
        ctx.lineTo(13.586,12);
        ctx.closePath();
        ctx.moveTo(1,14);
        ctx.translate(2,14);
        ctx.rotate(0);
        ctx.arc(0,0,1,3.141592653589793,1.5707963267948966,1);
        ctx.rotate(0);
        ctx.translate(-2,-14);
        ctx.lineTo(11.586,15);
        ctx.translate(11.585786430950666,14.00000002280587);
        ctx.rotate(0);
        ctx.arc(0,0,1,1.570582757743939,0.7852471311476533,1);
        ctx.rotate(0);
        ctx.translate(-11.585786430950666,-14.00000002280587);
        ctx.lineTo(14.707,12.293000000000001);
        ctx.translate(14.00000002280587,11.585786430950666);
        ctx.rotate(0);
        ctx.arc(0,0,1,0.7855491956472431,0.000213569050957374,1);
        ctx.rotate(0);
        ctx.translate(-14.00000002280587,-11.585786430950666);
        ctx.lineTo(15,2);
        ctx.translate(14,2);
        ctx.rotate(0);
        ctx.arc(0,0,1,0,-1.5707963267948966,1);
        ctx.rotate(0);
        ctx.translate(-14,-2);
        ctx.lineTo(2,1);
        ctx.translate(2,2);
        ctx.rotate(0);
        ctx.arc(0,0,1,-1.5707963267948966,-3.141592653589793,1);
        ctx.rotate(0);
        ctx.translate(-2,-2);
        ctx.lineTo(1,14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
    function drawIconParagraph(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(11,2);
        ctx.lineTo(7,2);
        ctx.lineTo(7,3);
        ctx.bezierCurveTo(5.5,3,4,3.691,4,5.5);
        ctx.bezierCurveTo(4,7.5,5.62,8,7,8);
        ctx.lineTo(7,14);
        ctx.lineTo(11,14);
        ctx.lineTo(11,2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(6.5,9);
        ctx.bezierCurveTo(6.67,9,6.837,8.988,7,8.965);
        ctx.lineTo(7,14);
        ctx.lineTo(11,14);
        ctx.lineTo(11,3);
        ctx.lineTo(12,3);
        ctx.lineTo(12,2);
        ctx.lineTo(6.5,2);
        ctx.translate(6.5,5.5);
        ctx.rotate(0);
        ctx.arc(0,0,3.5,-1.5707963267948966,1.5707963267948966,1);
        ctx.rotate(0);
        ctx.translate(-6.5,-5.5);
        ctx.closePath();
        ctx.moveTo(10,13);
        ctx.lineTo(8,13);
        ctx.lineTo(8,3);
        ctx.lineTo(10,3);
        ctx.lineTo(10,13);
        ctx.closePath();
        ctx.moveTo(7,8);
        ctx.bezierCurveTo(5.62,8,4,7.5,4,5.5);
        ctx.bezierCurveTo(4,3.691,5.5,3,7,3);
        ctx.lineTo(7,8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
    function drawIconRightArrow(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(6,11);
        ctx.lineTo(0,11);
        ctx.lineTo(0,4);
        ctx.lineTo(6,4);
        ctx.lineTo(6,0);
        ctx.lineTo(16,7.5);
        ctx.lineTo(6,15);
        ctx.lineTo(6,11);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(7,10);
        ctx.lineTo(7,13);
        ctx.lineTo(14.333,7.5);
        ctx.lineTo(7,2);
        ctx.lineTo(7,5);
        ctx.lineTo(1,5);
        ctx.lineTo(1,10);
        ctx.lineTo(7,10);
        ctx.closePath();
        ctx.moveTo(6,0);
        ctx.lineTo(16,7.5);
        ctx.lineTo(6,15);
        ctx.lineTo(6,11);
        ctx.lineTo(0,11);
        ctx.lineTo(0,4);
        ctx.lineTo(6,4);
        ctx.lineTo(6,0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
    function drawIconRightPointer(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(0.628,0.343);
        ctx.lineTo(15.73,7.5);
        ctx.lineTo(0.628,14.657);
        ctx.lineTo(5.399,7.5);
        ctx.lineTo(0.628,0.343);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(0.628,0.343);
        ctx.lineTo(15.73,7.5);
        ctx.lineTo(0.628,14.657);
        ctx.lineTo(5.399,7.5);
        ctx.lineTo(0.628,0.343);
        ctx.closePath();
        ctx.moveTo(3.3720000000000003,2.657);
        ctx.lineTo(6.601,7.5);
        ctx.lineTo(3.372,12.343);
        ctx.lineTo(13.27,7.5);
        ctx.lineTo(3.372,2.657);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
    function drawIconStar(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(9.152,6.348);
        ctx.lineTo(7.5,1);
        ctx.lineTo(5.848,6.348);
        ctx.lineTo(0.5,6.348);
        ctx.lineTo(4.826,9.652);
        ctx.lineTo(3.174,15);
        ctx.lineTo(7.5,11.695);
        ctx.lineTo(11.826,15);
        ctx.lineTo(10.174000000000001,9.652000000000001);
        ctx.lineTo(14.5,6.348);
        ctx.lineTo(9.152,6.348);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(9.152,6.348);
        ctx.lineTo(7.5,1);
        ctx.lineTo(5.848,6.348);
        ctx.lineTo(0.5,6.348);
        ctx.lineTo(4.826,9.652);
        ctx.lineTo(3.174,15);
        ctx.lineTo(7.5,11.695);
        ctx.lineTo(11.826,15);
        ctx.lineTo(10.174000000000001,9.652000000000001);
        ctx.lineTo(14.5,6.348);
        ctx.lineTo(9.152,6.348);
        ctx.closePath();
        ctx.moveTo(11.913,7.223);
        ctx.lineTo(8.507,7.223);
        ctx.lineTo(7.5,3.963);
        ctx.lineTo(6.493,7.223);
        ctx.lineTo(3.087,7.223);
        ctx.lineTo(5.8420000000000005,9.328);
        ctx.lineTo(4.8180000000000005,12.642999999999999);
        ctx.lineTo(7.5,10.593);
        ctx.lineTo(10.182,12.643);
        ctx.lineTo(9.158000000000001,9.328000000000001);
        ctx.lineTo(11.913,7.223000000000001);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
    function drawIconUpArrow(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(16,0);
        ctx.lineTo(16,16);
        ctx.lineTo(0,16);
        ctx.closePath();
        ctx.clip();
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(0,10);
        ctx.lineTo(7.5,0);
        ctx.lineTo(15,10);
        ctx.lineTo(11,10);
        ctx.lineTo(11,16);
        ctx.lineTo(4,16);
        ctx.lineTo(4,10);
        ctx.lineTo(0,10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(10,9);
        ctx.lineTo(13,9);
        ctx.lineTo(7.5,1.667);
        ctx.lineTo(2,9);
        ctx.lineTo(5,9);
        ctx.lineTo(5,15);
        ctx.lineTo(10,15);
        ctx.lineTo(10,9);
        ctx.closePath();
        ctx.moveTo(0,10);
        ctx.lineTo(7.5,0);
        ctx.lineTo(15,10);
        ctx.lineTo(11,10);
        ctx.lineTo(11,16);
        ctx.lineTo(4,16);
        ctx.lineTo(4,10);
        ctx.lineTo(0,10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();

        ctx.restore();
    }
    function drawIconUpLeftArrow(ctx, x, y, xScale, yScale, rotationAngle) {
        ctx.save();
        ctx.translate(x + 8 * xScale, y + 8 * yScale);
        ctx.rotate(rotationAngle);
        ctx.translate(-8 * xScale, -8 * yScale);
        ctx.scale(xScale, yScale);

        ctx.strokeStyle="rgba(0,0,0,0)";
        ctx.miterLimit=4;
        ctx.font="15px ''";
        ctx.fillStyle="rgba(0,0,0,0)";
        ctx.font="   15px ''";
        ctx.save();
        ctx.fillStyle=ctx.iconFill;
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(11.5,1.5);
        ctx.lineTo(1.5,1.5);
        ctx.lineTo(1.5,11.5);
        ctx.lineTo(4.5,8.5);
        ctx.lineTo(9.5,13.5);
        ctx.lineTo(13.5,9.5);
        ctx.lineTo(8.5,4.5);
        ctx.lineTo(11.5,1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle="#000";
        ctx.font="   15px ''";
        ctx.beginPath();
        ctx.moveTo(1,1);
        ctx.lineTo(12.707,1);
        ctx.lineTo(9.207,4.5);
        ctx.lineTo(14.207,9.5);
        ctx.lineTo(9.5,14.207);
        ctx.lineTo(4.5,9.207);
        ctx.lineTo(1,12.707);
        ctx.lineTo(1,1);
        ctx.closePath();
        ctx.moveTo(2,2);
        ctx.lineTo(2,10.293);
        ctx.lineTo(4.5,7.792999999999999);
        ctx.lineTo(9.5,12.793);
        ctx.lineTo(12.793,9.5);
        ctx.lineTo(7.792999999999999,4.5);
        ctx.lineTo(10.293,2);
        ctx.lineTo(2,2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
})();

