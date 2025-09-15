"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const parse_diff_1 = __importDefault(require("parse-diff"));
class ReviewService {
}
exports.ReviewService = ReviewService;
_a = ReviewService;
ReviewService.getNumberOfChangedStrings = (diff) => __awaiter(void 0, void 0, void 0, function* () {
    console.info(diff);
    const files = (0, parse_diff_1.default)(diff);
    let numbers = [];
    console.info(files);
    files.forEach(file => {
        console.info(`Файл: ${file.to}`);
        let lastDiffLineNumber = null;
        let currentRange = null;
        file.chunks.forEach(chunk => {
            chunk.changes.forEach(change => {
                if (change.type === "add" || change.type === "del") {
                    const lineNum = change.ln;
                    if (lineNum == null)
                        return;
                    if (lastDiffLineNumber === null || Math.abs(lineNum - lastDiffLineNumber) > 1) {
                        if (currentRange) {
                            numbers.push(currentRange);
                        }
                        currentRange = {
                            path: file.to || file.from || "unknown",
                            start_line: lineNum,
                            end_line: lineNum,
                            annotation_level: "warning",
                            message: `Изменена строка ${lineNum}`,
                            title: "Diff Analyzer"
                        };
                    }
                    else if (currentRange) {
                        currentRange.end_line = lineNum;
                        currentRange.message = `Изменены строки ${currentRange.start_line}–${lineNum}`;
                    }
                    lastDiffLineNumber = lineNum;
                }
            });
        });
        if (currentRange) {
            numbers.push(currentRange);
        }
    });
    return numbers;
});
