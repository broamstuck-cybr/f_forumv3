import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import wawoff2 from 'wawoff2';

const FONT_NAME = 'FForum Display';
const STYLE_NAME = 'Regular';
const UPM = 1000;
const ASCENDER = 780;
const DESCENDER = -220;
const CAP_HEIGHT = 700;
const X_HEIGHT = 470;

const STEM = 120;
const HAIR = 22;

function createGlyphPath(type) {
  const p = new opentype.Path();
  switch (type) {
    case 'F':
      p.moveTo(80, 0);
      p.lineTo(260, 0);
      p.lineTo(260, HAIR);
      p.lineTo(195, HAIR);
      p.lineTo(195, CAP_HEIGHT - HAIR);
      p.lineTo(460, CAP_HEIGHT - HAIR);
      p.lineTo(460, CAP_HEIGHT - 65);
      p.lineTo(478, CAP_HEIGHT - 65);
      p.lineTo(478, CAP_HEIGHT);
      p.lineTo(80, CAP_HEIGHT);
      p.lineTo(80, CAP_HEIGHT - HAIR);
      p.lineTo(135, CAP_HEIGHT - HAIR);
      p.lineTo(135, 380);
      p.lineTo(340, 380);
      p.lineTo(352, 335);
      p.lineTo(336, 335);
      p.lineTo(315, 360);
      p.lineTo(135, 360);
      p.lineTo(135, HAIR);
      p.lineTo(80, HAIR);
      p.close();
      return { path: p, width: 520 };

    case 'T':
      p.moveTo(50, CAP_HEIGHT - HAIR);
      p.lineTo(50, CAP_HEIGHT);
      p.lineTo(550, CAP_HEIGHT);
      p.lineTo(550, CAP_HEIGHT - HAIR);
      p.lineTo(340, CAP_HEIGHT - HAIR);
      p.lineTo(340, HAIR);
      p.lineTo(400, HAIR);
      p.lineTo(400, 0);
      p.lineTo(200, 0);
      p.lineTo(200, HAIR);
      p.lineTo(260, HAIR);
      p.lineTo(260, CAP_HEIGHT - HAIR);
      p.close();
      return { path: p, width: 600 };

    case 'o':
      p.moveTo(270, 0);
      p.bezierCurveTo(155, 0, 75, 105, 75, 235);
      p.bezierCurveTo(75, 365, 155, X_HEIGHT, 270, X_HEIGHT);
      p.bezierCurveTo(385, X_HEIGHT, 465, 365, 465, 235);
      p.bezierCurveTo(465, 105, 385, 0, 270, 0);
      p.close();
      p.moveTo(270, HAIR);
      p.bezierCurveTo(345, HAIR, 380, 110, 380, 235);
      p.bezierCurveTo(380, 360, 345, X_HEIGHT - HAIR, 270, X_HEIGHT - HAIR);
      p.bezierCurveTo(195, X_HEIGHT - HAIR, 160, 360, 160, 235);
      p.bezierCurveTo(160, 110, 195, HAIR, 270, HAIR);
      p.close();
      return { path: p, width: 540 };

    case 'r':
      p.moveTo(70, 0);
      p.lineTo(210, 0);
      p.lineTo(210, HAIR);
      p.lineTo(160, HAIR);
      p.lineTo(160, X_HEIGHT - HAIR);
      p.lineTo(200, X_HEIGHT - HAIR);
      p.lineTo(200, X_HEIGHT);
      p.lineTo(70, X_HEIGHT);
      p.lineTo(70, X_HEIGHT - HAIR);
      p.lineTo(110, X_HEIGHT - HAIR);
      p.lineTo(110, HAIR);
      p.lineTo(70, HAIR);
      p.close();
      p.moveTo(160, X_HEIGHT - 90);
      p.bezierCurveTo(205, X_HEIGHT, 280, X_HEIGHT + 10, 345, X_HEIGHT - 25);
      p.bezierCurveTo(370, X_HEIGHT - 45, 375, X_HEIGHT - 75, 360, X_HEIGHT - 90);
      p.bezierCurveTo(345, X_HEIGHT - 105, 320, X_HEIGHT - 95, 310, X_HEIGHT - 70);
      p.bezierCurveTo(285, X_HEIGHT - 40, 230, X_HEIGHT - 35, 160, X_HEIGHT - 80);
      p.close();
      return { path: p, width: 380 };

    case 'u':
      p.moveTo(70, X_HEIGHT);
      p.lineTo(200, X_HEIGHT);
      p.lineTo(200, X_HEIGHT - HAIR);
      p.lineTo(155, X_HEIGHT - HAIR);
      p.lineTo(155, 140);
      p.bezierCurveTo(155, 50, 205, 0, 290, 0);
      p.bezierCurveTo(370, 0, 420, 50, 420, 140);
      p.lineTo(420, X_HEIGHT - HAIR);
      p.lineTo(375, X_HEIGHT - HAIR);
      p.lineTo(375, X_HEIGHT);
      p.lineTo(510, X_HEIGHT);
      p.lineTo(510, X_HEIGHT - HAIR);
      p.lineTo(465, X_HEIGHT - HAIR);
      p.lineTo(465, 0);
      p.lineTo(365, 0);
      p.lineTo(365, 45);
      p.bezierCurveTo(335, 12, 290, 0, 245, 0);
      p.bezierCurveTo(150, 0, 105, 55, 105, 160);
      p.lineTo(105, X_HEIGHT - HAIR);
      p.lineTo(70, X_HEIGHT - HAIR);
      p.close();
      return { path: p, width: 580 };

    case 'm':
      p.moveTo(60, 0);
      p.lineTo(180, 0);
      p.lineTo(180, HAIR);
      p.lineTo(140, HAIR);
      p.lineTo(140, X_HEIGHT - HAIR);
      p.lineTo(180, X_HEIGHT - HAIR);
      p.lineTo(180, X_HEIGHT);
      p.lineTo(60, X_HEIGHT);
      p.lineTo(60, X_HEIGHT - HAIR);
      p.lineTo(95, X_HEIGHT - HAIR);
      p.lineTo(95, HAIR);
      p.lineTo(60, HAIR);
      p.close();
      p.moveTo(140, X_HEIGHT - 70);
      p.bezierCurveTo(185, X_HEIGHT + 8, 255, X_HEIGHT + 8, 300, X_HEIGHT - 60);
      p.bezierCurveTo(345, X_HEIGHT + 8, 420, X_HEIGHT + 8, 470, X_HEIGHT - 60);
      p.lineTo(470, HAIR);
      p.lineTo(440, HAIR);
      p.lineTo(440, 0);
      p.lineTo(570, 0);
      p.lineTo(570, HAIR);
      p.lineTo(530, HAIR);
      p.lineTo(530, X_HEIGHT - 120);
      p.bezierCurveTo(530, X_HEIGHT - 40, 485, X_HEIGHT, 430, X_HEIGHT);
      p.bezierCurveTo(370, X_HEIGHT, 335, X_HEIGHT - 45, 320, X_HEIGHT - 95);
      p.bezierCurveTo(305, X_HEIGHT - 40, 260, X_HEIGHT, 210, X_HEIGHT);
      p.bezierCurveTo(175, X_HEIGHT, 150, X_HEIGHT - 35, 140, X_HEIGHT - 70);
      p.close();
      p.moveTo(300, X_HEIGHT - 80);
      p.lineTo(300, 0);
      p.lineTo(360, 0);
      p.lineTo(360, HAIR);
      p.lineTo(345, HAIR);
      p.lineTo(345, X_HEIGHT - 110);
      p.bezierCurveTo(345, X_HEIGHT - 60, 330, X_HEIGHT - 75, 300, X_HEIGHT - 80);
      p.close();
      return { path: p, width: 640 };

    case 'a':
      p.moveTo(360, X_HEIGHT);
      p.lineTo(430, X_HEIGHT);
      p.lineTo(430, 0);
      p.lineTo(345, 0);
      p.lineTo(345, 45);
      p.bezierCurveTo(310, 10, 265, 0, 215, 0);
      p.bezierCurveTo(130, 0, 75, 45, 75, 120);
      p.bezierCurveTo(75, 205, 160, 235, 345, 235);
      p.lineTo(345, 280);
      p.bezierCurveTo(345, 360, 305, X_HEIGHT - HAIR, 220, X_HEIGHT - HAIR);
      p.bezierCurveTo(165, X_HEIGHT - HAIR, 125, 365, 115, 330);
      p.lineTo(95, 330);
      p.lineTo(105, 385);
      p.bezierCurveTo(135, X_HEIGHT + 10, 190, X_HEIGHT + 10, 245, X_HEIGHT + 10);
      p.bezierCurveTo(365, X_HEIGHT + 10, 415, 345, 415, 260);
      p.lineTo(415, 75);
      p.bezierCurveTo(415, 35, 435, HAIR, 455, HAIR);
      p.lineTo(455, 0);
      p.close();
      p.moveTo(345, 80);
      p.lineTo(345, 190);
      p.bezierCurveTo(205, 190, 150, 165, 150, 115);
      p.bezierCurveTo(150, 75, 185, 35, 245, 35);
      p.bezierCurveTo(295, 35, 335, 55, 345, 80);
      p.close();
      return { path: p, width: 490 };

    case 'e':
      p.moveTo(260, 0);
      p.bezierCurveTo(145, 0, 70, 100, 70, 235);
      p.bezierCurveTo(70, 365, 150, X_HEIGHT + 10, 260, X_HEIGHT + 10);
      p.bezierCurveTo(370, X_HEIGHT + 10, 440, 360, 440, 235);
      p.lineTo(145, 235);
      p.bezierCurveTo(145, 115, 185, HAIR, 265, HAIR);
      p.bezierCurveTo(325, HAIR, 380, 55, 395, 105);
      p.lineTo(420, 100);
      p.bezierCurveTo(400, 35, 345, 0, 260, 0);
      p.close();
      p.moveTo(145, 265);
      p.lineTo(375, 265);
      p.bezierCurveTo(375, 350, 335, X_HEIGHT - HAIR, 260, X_HEIGHT - HAIR);
      p.bezierCurveTo(195, X_HEIGHT - HAIR, 155, 340, 145, 265);
      p.close();
      return { path: p, width: 490 };

    case 'p':
      p.moveTo(70, -200);
      p.lineTo(190, -200);
      p.lineTo(190, -200 + HAIR);
      p.lineTo(150, -200 + HAIR);
      p.lineTo(150, X_HEIGHT - HAIR);
      p.lineTo(190, X_HEIGHT - HAIR);
      p.lineTo(190, X_HEIGHT);
      p.lineTo(70, X_HEIGHT);
      p.lineTo(70, X_HEIGHT - HAIR);
      p.lineTo(105, X_HEIGHT - HAIR);
      p.lineTo(105, -200 + HAIR);
      p.lineTo(70, -200 + HAIR);
      p.close();
      p.moveTo(150, X_HEIGHT - 60);
      p.bezierCurveTo(205, X_HEIGHT + 10, 305, X_HEIGHT + 10, 365, 360);
      p.bezierCurveTo(430, 300, 460, 210, 460, 130);
      p.bezierCurveTo(460, 45, 415, 0, 340, 0);
      p.bezierCurveTo(265, 0, 190, 35, 150, 85);
      p.close();
      p.moveTo(150, 120);
      p.bezierCurveTo(190, 50, 250, HAIR, 320, HAIR);
      p.bezierCurveTo(370, HAIR, 410, 60, 410, 140);
      p.bezierCurveTo(410, 230, 370, X_HEIGHT - HAIR, 305, X_HEIGHT - HAIR);
      p.bezierCurveTo(240, X_HEIGHT - HAIR, 185, 340, 150, 280);
      p.close();
      return { path: p, width: 510 };

    case 'h':
      p.moveTo(70, 0);
      p.lineTo(190, 0);
      p.lineTo(190, HAIR);
      p.lineTo(150, HAIR);
      p.lineTo(150, CAP_HEIGHT - HAIR);
      p.lineTo(190, CAP_HEIGHT - HAIR);
      p.lineTo(190, CAP_HEIGHT);
      p.lineTo(70, CAP_HEIGHT);
      p.lineTo(70, CAP_HEIGHT - HAIR);
      p.lineTo(105, CAP_HEIGHT - HAIR);
      p.lineTo(105, HAIR);
      p.lineTo(70, HAIR);
      p.close();
      p.moveTo(150, X_HEIGHT - 80);
      p.bezierCurveTo(205, X_HEIGHT + 10, 285, X_HEIGHT + 10, 350, 370);
      p.bezierCurveTo(410, 320, 440, 240, 440, 160);
      p.lineTo(440, HAIR);
      p.lineTo(480, HAIR);
      p.lineTo(480, 0);
      p.lineTo(340, 0);
      p.lineTo(340, HAIR);
      p.lineTo(385, HAIR);
      p.lineTo(385, 150);
      p.bezierCurveTo(385, 230, 360, X_HEIGHT - HAIR, 290, X_HEIGHT - HAIR);
      p.bezierCurveTo(225, X_HEIGHT - HAIR, 180, 320, 150, 260);
      p.close();
      return { path: p, width: 530 };

    case 'c':
      p.moveTo(420, 360);
      p.bezierCurveTo(395, 415, 340, X_HEIGHT + 10, 260, X_HEIGHT + 10);
      p.bezierCurveTo(145, X_HEIGHT + 10, 70, 365, 70, 235);
      p.bezierCurveTo(70, 105, 145, 0, 260, 0);
      p.bezierCurveTo(345, 0, 410, 50, 435, 120);
      p.lineTo(410, 130);
      p.bezierCurveTo(390, 75, 340, HAIR, 260, HAIR);
      p.bezierCurveTo(185, HAIR, 145, 110, 145, 235);
      p.bezierCurveTo(145, 360, 185, X_HEIGHT - HAIR, 260, X_HEIGHT - HAIR);
      p.bezierCurveTo(325, X_HEIGHT - HAIR, 380, 380, 400, 345);
      p.close();
      return { path: p, width: 480 };

    case 't':
      p.moveTo(110, 600);
      p.lineTo(155, 600);
      p.lineTo(155, X_HEIGHT);
      p.lineTo(260, X_HEIGHT);
      p.lineTo(260, X_HEIGHT - 35);
      p.lineTo(155, X_HEIGHT - 35);
      p.lineTo(155, 120);
      p.bezierCurveTo(155, 35, 190, 0, 270, 0);
      p.bezierCurveTo(300, 0, 330, 12, 345, 25);
      p.lineTo(355, 5);
      p.bezierCurveTo(335, -5, 295, -15, 255, -15);
      p.bezierCurveTo(140, -15, 95, 35, 95, 140);
      p.lineTo(95, X_HEIGHT - 35);
      p.lineTo(45, X_HEIGHT - 35);
      p.lineTo(45, X_HEIGHT);
      p.lineTo(95, X_HEIGHT);
      p.lineTo(95, 600);
      p.close();
      return { path: p, width: 370 };

    case 'd':
      p.moveTo(345, CAP_HEIGHT);
      p.lineTo(440, CAP_HEIGHT);
      p.lineTo(440, CAP_HEIGHT - HAIR);
      p.lineTo(400, CAP_HEIGHT - HAIR);
      p.lineTo(400, 45);
      p.bezierCurveTo(370, 12, 325, 0, 275, 0);
      p.bezierCurveTo(155, 0, 75, 105, 75, 235);
      p.bezierCurveTo(75, 365, 155, X_HEIGHT, 275, X_HEIGHT);
      p.bezierCurveTo(325, X_HEIGHT, 370, 455, 400, 420);
      p.lineTo(400, CAP_HEIGHT - HAIR);
      p.lineTo(345, CAP_HEIGHT - HAIR);
      p.close();
      p.moveTo(275, HAIR);
      p.bezierCurveTo(350, HAIR, 385, 110, 385, 235);
      p.bezierCurveTo(385, 360, 350, X_HEIGHT - HAIR, 275, X_HEIGHT - HAIR);
      p.bezierCurveTo(200, X_HEIGHT - HAIR, 160, 360, 160, 235);
      p.bezierCurveTo(160, 110, 200, HAIR, 275, HAIR);
      p.close();
      return { path: p, width: 530 };

    case 'n':
      p.moveTo(70, 0);
      p.lineTo(190, 0);
      p.lineTo(190, HAIR);
      p.lineTo(150, HAIR);
      p.lineTo(150, X_HEIGHT - HAIR);
      p.lineTo(190, X_HEIGHT - HAIR);
      p.lineTo(190, X_HEIGHT);
      p.lineTo(70, X_HEIGHT);
      p.lineTo(70, X_HEIGHT - HAIR);
      p.lineTo(105, X_HEIGHT - HAIR);
      p.lineTo(105, HAIR);
      p.lineTo(70, HAIR);
      p.close();
      p.moveTo(150, X_HEIGHT - 80);
      p.bezierCurveTo(205, X_HEIGHT + 10, 285, X_HEIGHT + 10, 350, 370);
      p.bezierCurveTo(410, 320, 440, 240, 440, 160);
      p.lineTo(440, HAIR);
      p.lineTo(480, HAIR);
      p.lineTo(480, 0);
      p.lineTo(340, 0);
      p.lineTo(340, HAIR);
      p.lineTo(385, HAIR);
      p.lineTo(385, 150);
      p.bezierCurveTo(385, 230, 360, X_HEIGHT - HAIR, 290, X_HEIGHT - HAIR);
      p.bezierCurveTo(225, X_HEIGHT - HAIR, 180, 320, 150, 260);
      p.close();
      return { path: p, width: 530 };

    case 's':
      p.moveTo(370, 365);
      p.bezierCurveTo(335, 415, 280, X_HEIGHT + 10, 215, X_HEIGHT + 10);
      p.bezierCurveTo(135, X_HEIGHT + 10, 85, 365, 85, 295);
      p.bezierCurveTo(85, 205, 165, 175, 265, 145);
      p.bezierCurveTo(325, 125, 365, 95, 365, 45);
      p.bezierCurveTo(365, -15, 310, -50, 225, -50);
      p.bezierCurveTo(155, -50, 105, -20, 75, 35);
      p.lineTo(55, 20);
      p.bezierCurveTo(90, -35, 155, -70, 235, -70);
      p.bezierCurveTo(330, -70, 395, -20, 395, 60);
      p.bezierCurveTo(395, 145, 320, 185, 220, 215);
      p.bezierCurveTo(150, 235, 115, 265, 115, 310);
      p.bezierCurveTo(115, 360, 160, X_HEIGHT - HAIR, 225, X_HEIGHT - HAIR);
      p.bezierCurveTo(285, X_HEIGHT - HAIR, 335, 385, 350, 350);
      p.close();
      return { path: p, width: 440 };

    case 'x':
      p.moveTo(50, X_HEIGHT);
      p.lineTo(150, X_HEIGHT);
      p.lineTo(240, 235);
      p.lineTo(330, X_HEIGHT);
      p.lineTo(430, X_HEIGHT);
      p.lineTo(290, 190);
      p.lineTo(440, 0);
      p.lineTo(340, 0);
      p.lineTo(240, 145);
      p.lineTo(140, 0);
      p.lineTo(40, 0);
      p.lineTo(190, 190);
      p.close();
      return { path: p, width: 480 };

    case 'g':
      p.moveTo(250, X_HEIGHT);
      p.bezierCurveTo(350, X_HEIGHT, 410, 395, 410, 310);
      p.bezierCurveTo(410, 250, 360, 215, 310, 195);
      p.bezierCurveTo(345, 175, 390, 130, 390, 60);
      p.bezierCurveTo(390, -80, 280, -190, 150, -190);
      p.bezierCurveTo(65, -190, 10, -145, 10, -90);
      p.bezierCurveTo(10, -35, 60, 5, 125, 5);
      p.bezierCurveTo(175, 5, 230, -20, 275, -55);
      p.bezierCurveTo(315, -15, 315, 50, 260, 85);
      p.bezierCurveTo(235, 75, 195, 70, 160, 70);
      p.bezierCurveTo(65, 70, 15, 140, 15, 235);
      p.bezierCurveTo(15, 360, 115, X_HEIGHT, 250, X_HEIGHT);
      p.close();
      p.moveTo(410, 385);
      p.bezierCurveTo(445, 410, 475, 395, 465, 365);
      p.bezierCurveTo(450, 350, 420, 355, 410, 385);
      p.close();
      return { path: p, width: 510 };

    case 'y':
      p.moveTo(60, X_HEIGHT);
      p.lineTo(180, X_HEIGHT);
      p.lineTo(180, X_HEIGHT - HAIR);
      p.lineTo(140, X_HEIGHT - HAIR);
      p.lineTo(260, 140);
      p.lineTo(380, X_HEIGHT - HAIR);
      p.lineTo(340, X_HEIGHT - HAIR);
      p.lineTo(340, X_HEIGHT);
      p.lineTo(470, X_HEIGHT);
      p.lineTo(470, X_HEIGHT - HAIR);
      p.lineTo(430, X_HEIGHT - HAIR);
      p.lineTo(290, -90);
      p.bezierCurveTo(250, -180, 195, -220, 120, -220);
      p.bezierCurveTo(80, -220, 45, -200, 35, -170);
      p.bezierCurveTo(45, -150, 70, -155, 85, -170);
      p.bezierCurveTo(115, -195, 155, -195, 185, -130);
      p.lineTo(205, -85);
      p.lineTo(85, X_HEIGHT - HAIR);
      p.lineTo(60, X_HEIGHT - HAIR);
      p.close();
      return { path: p, width: 500 };

    default:
      return null;
  }
}

function drawDiacriticPath(type, targetX, targetY, isCap = false) {
  const p = new opentype.Path();
  const yShift = isCap ? 740 : 500;
  const xMid = targetX;

  switch (type) {
    case 'acute':
      p.moveTo(xMid - 35, yShift + 25);
      p.bezierCurveTo(xMid - 10, yShift + 65, xMid + 25, yShift + 105, xMid + 45, yShift + 130);
      p.lineTo(xMid + 50, yShift + 125);
      p.bezierCurveTo(xMid + 20, yShift + 85, xMid - 5, yShift + 45, xMid - 25, yShift + 20);
      p.close();
      break;

    case 'grave':
      p.moveTo(xMid + 35, yShift + 25);
      p.bezierCurveTo(xMid + 10, yShift + 65, xMid - 25, yShift + 105, xMid - 45, yShift + 130);
      p.lineTo(xMid - 50, yShift + 125);
      p.bezierCurveTo(xMid - 20, yShift + 85, xMid + 5, yShift + 45, xMid + 25, yShift + 20);
      p.close();
      break;

    case 'hook':
      p.moveTo(xMid - 10, yShift + 20);
      p.bezierCurveTo(xMid + 25, yShift + 45, xMid + 35, yShift + 85, xMid + 15, yShift + 115);
      p.bezierCurveTo(xMid - 5, yShift + 135, xMid - 30, yShift + 125, xMid - 35, yShift + 100);
      p.bezierCurveTo(xMid - 25, yShift + 95, xMid - 15, yShift + 110, xMid - 5, yShift + 105);
      p.bezierCurveTo(xMid + 10, yShift + 95, xMid + 5, yShift + 65, xMid - 15, yShift + 35);
      p.close();
      break;

    case 'tilde':
      p.moveTo(xMid - 45, yShift + 40);
      p.bezierCurveTo(xMid - 25, yShift + 85, xMid - 5, yShift + 85, xMid + 10, yShift + 55);
      p.bezierCurveTo(xMid + 25, yShift + 30, xMid + 40, yShift + 45, xMid + 48, yShift + 70);
      p.lineTo(xMid + 52, yShift + 65);
      p.bezierCurveTo(xMid + 30, yShift + 15, xMid + 10, yShift + 15, xMid - 5, yShift + 45);
      p.bezierCurveTo(xMid - 20, yShift + 70, xMid - 35, yShift + 55, xMid - 43, yShift + 35);
      p.close();
      break;

    case 'dotbelow':
      p.moveTo(xMid - 18, -60);
      p.lineTo(xMid + 18, -60);
      p.lineTo(xMid + 18, -96);
      p.lineTo(xMid - 18, -96);
      p.close();
      break;

    case 'circumflex':
      p.moveTo(xMid - 60, yShift + 25);
      p.lineTo(xMid, yShift + 95);
      p.lineTo(xMid + 60, yShift + 25);
      p.lineTo(xMid + 45, yShift + 25);
      p.lineTo(xMid, yShift + 78);
      p.lineTo(xMid - 45, yShift + 25);
      p.close();
      break;

    case 'breve':
      p.moveTo(xMid - 55, yShift + 75);
      p.bezierCurveTo(xMid - 25, yShift + 15, xMid + 25, yShift + 15, xMid + 55, yShift + 75);
      p.bezierCurveTo(xMid + 42, yShift + 75, xMid + 18, yShift + 32, xMid, yShift + 32);
      p.bezierCurveTo(xMid - 18, yShift + 32, xMid - 42, yShift + 75, xMid - 55, yShift + 75);
      p.close();
      break;

    case 'horn':
      p.moveTo(xMid + 135, yShift - 40);
      p.bezierCurveTo(xMid + 165, yShift + 10, xMid + 205, yShift + 60, xMid + 185, yShift + 90);
      p.bezierCurveTo(xMid + 165, yShift + 70, xMid + 145, yShift + 35, xMid + 125, yShift + 5);
      p.close();
      break;

    case 'dbar':
      p.moveTo(270, 520);
      p.lineTo(440, 520);
      p.lineTo(440, 520 + HAIR);
      p.lineTo(270, 520 + HAIR);
      p.close();
      break;
  }

  return p;
}

export async function buildFForumFont() {
  const glyphs = [];

  const notdef = new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: 600,
    path: new opentype.Path()
  });
  glyphs.push(notdef);

  const space = new opentype.Glyph({
    name: 'space',
    unicode: 32,
    advanceWidth: 260,
    path: new opentype.Path()
  });
  glyphs.push(space);

  const hyphen = new opentype.Path();
  hyphen.moveTo(60, 240);
  hyphen.lineTo(260, 240);
  hyphen.lineTo(260, 240 + HAIR);
  hyphen.lineTo(60, 240 + HAIR);
  hyphen.close();
  glyphs.push(new opentype.Glyph({
    name: 'hyphen',
    unicode: 45,
    advanceWidth: 320,
    path: hyphen
  }));

  const colon = new opentype.Path();
  colon.moveTo(80, 80);
  colon.lineTo(110, 80);
  colon.lineTo(110, 110);
  colon.lineTo(80, 110);
  colon.close();
  colon.moveTo(80, 280);
  colon.lineTo(110, 280);
  colon.lineTo(110, 310);
  colon.lineTo(80, 310);
  colon.close();
  glyphs.push(new opentype.Glyph({
    name: 'colon',
    unicode: 58,
    advanceWidth: 200,
    path: colon
  }));

  const comma = new opentype.Path();
  comma.moveTo(80, 50);
  comma.lineTo(115, 50);
  comma.bezierCurveTo(115, -10, 95, -45, 65, -70);
  comma.lineTo(55, -60);
  comma.bezierCurveTo(75, -40, 85, -15, 85, 20);
  comma.lineTo(80, 20);
  comma.close();
  glyphs.push(new opentype.Glyph({
    name: 'comma',
    unicode: 44,
    advanceWidth: 200,
    path: comma
  }));

  const period = new opentype.Path();
  period.moveTo(80, 0);
  period.lineTo(115, 0);
  period.lineTo(115, 35);
  period.lineTo(80, 35);
  period.close();
  glyphs.push(new opentype.Glyph({
    name: 'period',
    unicode: 46,
    advanceWidth: 200,
    path: period
  }));

  const baseChars = ['F', 'T', 'o', 'r', 'u', 'm', 'a', 'e', 'p', 'h', 'c', 't', 'd', 'n', 's', 'x', 'g', 'y'];
  const baseMap = {};

  for (const ch of baseChars) {
    const info = createGlyphPath(ch);
    if (info) {
      baseMap[ch] = info;
      glyphs.push(new opentype.Glyph({
        name: ch,
        unicode: ch.charCodeAt(0),
        advanceWidth: info.width,
        path: info.path
      }));
    }
  }

  function addAccented(name, unicode, baseCh, diacritics) {
    const baseInfo = baseMap[baseCh];
    if (!baseInfo) return;

    const merged = new opentype.Path();
    merged.commands = [...baseInfo.path.commands];

    const isCap = baseCh === baseCh.toUpperCase() && baseCh !== baseCh.toLowerCase();
    const xMid = Math.round(baseInfo.width / 2);

    for (const d of diacritics) {
      const dPath = drawDiacriticPath(d, xMid, 0, isCap);
      merged.commands.push(...dPath.commands);
    }

    glyphs.push(new opentype.Glyph({
      name,
      unicode,
      advanceWidth: baseInfo.width,
      path: merged
    }));
  }

  addAccented('aacute', 0x00E1, 'a', ['acute']);
  addAccented('agrave', 0x00E0, 'a', ['grave']);
  addAccented('ahook', 0x1EA3, 'a', ['hook']);
  addAccented('atilde', 0x00E3, 'a', ['tilde']);
  addAccented('adotbelow', 0x1EA1, 'a', ['dotbelow']);

  addAccented('eacute', 0x00E9, 'e', ['acute']);
  addAccented('egrave', 0x00E8, 'e', ['grave']);
  addAccented('ehook', 0x1EBB, 'e', ['hook']);
  addAccented('etilde', 0x1EBD, 'e', ['tilde']);
  addAccented('edotbelow', 0x1EB9, 'e', ['dotbelow']);
  addAccented('ecircumflex', 0x00EA, 'e', ['circumflex']);
  addAccented('ecircumflexacute', 0x1EBF, 'e', ['circumflex', 'acute']);

  addAccented('oacute', 0x00F5, 'o', ['acute']);
  addAccented('ograve', 0x00F2, 'o', ['grave']);
  addAccented('ohook', 0x1ECF, 'o', ['hook']);
  addAccented('otilde', 0x00F5, 'o', ['tilde']);
  addAccented('odotbelow', 0x1ECD, 'o', ['dotbelow']);
  addAccented('ocircumflex', 0x00F4, 'o', ['circumflex']);
  addAccented('ocircumflexgrave', 0x1ED3, 'o', ['circumflex', 'grave']);
  addAccented('ohorn', 0x01A1, 'o', ['horn']);
  addAccented('ohorndotbelow', 0x1EE3, 'o', ['horn', 'dotbelow']);

  addAccented('uacute', 0x00FA, 'u', ['acute']);
  addAccented('ugrave', 0x00F9, 'u', ['grave']);
  addAccented('uhook', 0x1EE7, 'u', ['hook']);
  addAccented('utilde', 0x0169, 'u', ['tilde']);
  addAccented('udotbelow', 0x1EE5, 'u', ['dotbelow']);
  addAccented('uhorn', 0x01B0, 'u', ['horn']);
  addAccented('uhorngrave', 0x1EEB, 'u', ['horn', 'grave']);

  addAccented('dstroke', 0x0111, 'd', ['dbar']);

  const pTrLig = new opentype.Path();
  pTrLig.moveTo(40, CAP_HEIGHT - HAIR);
  pTrLig.lineTo(40, CAP_HEIGHT);
  pTrLig.lineTo(480, CAP_HEIGHT);
  pTrLig.lineTo(480, CAP_HEIGHT - HAIR);
  pTrLig.lineTo(280, CAP_HEIGHT - HAIR);
  pTrLig.lineTo(280, HAIR);
  pTrLig.lineTo(340, HAIR);
  pTrLig.lineTo(340, 0);
  pTrLig.lineTo(160, 0);
  pTrLig.lineTo(160, HAIR);
  pTrLig.lineTo(220, HAIR);
  pTrLig.lineTo(220, CAP_HEIGHT - HAIR);
  pTrLig.close();
  pTrLig.moveTo(340, X_HEIGHT - 60);
  pTrLig.bezierCurveTo(400, X_HEIGHT + 10, 480, X_HEIGHT + 10, 540, X_HEIGHT - 20);
  pTrLig.bezierCurveTo(565, X_HEIGHT - 45, 570, X_HEIGHT - 75, 555, X_HEIGHT - 90);
  pTrLig.bezierCurveTo(540, X_HEIGHT - 105, 515, X_HEIGHT - 95, 505, X_HEIGHT - 70);
  pTrLig.bezierCurveTo(475, X_HEIGHT - 35, 420, X_HEIGHT - 30, 340, X_HEIGHT - 50);
  pTrLig.close();
  glyphs.push(new opentype.Glyph({
    name: 'T_r',
    unicode: 0xE001,
    advanceWidth: 620,
    path: pTrLig
  }));

  const font = new opentype.Font({
    familyName: FONT_NAME,
    styleName: STYLE_NAME,
    unitsPerEm: UPM,
    ascender: ASCENDER,
    descender: DESCENDER,
    glyphs
  });

  const arrayBuffer = font.toArrayBuffer();
  const fontDir = path.resolve('public/fonts');
  if (!fs.existsSync(fontDir)) {
    fs.mkdirSync(fontDir, { recursive: true });
  }

  const ttfBuffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(path.join(fontDir, 'fforum-display.ttf'), ttfBuffer);

  const woff2Buffer = await wawoff2.compress(ttfBuffer);
  fs.writeFileSync(path.join(fontDir, 'fforum-display.woff2'), woff2Buffer);

  console.log(`[PASS] Built ${FONT_NAME}: TTF (${ttfBuffer.length} B), WOFF2 (${woff2Buffer.length} B) with ${glyphs.length} glyphs.`);
}

buildFForumFont().catch(console.error);
