import parseDiff, { File } from "parse-diff";
import { FileDiffRange } from "./utils/Types";

export class ReviewService {
    public static readonly getNumberOfChangedStrings = async (
        diff: string
    ): Promise<FileDiffRange[]> => {

        console.info(diff);

        const files: File[] = parseDiff(diff);
        let numbers: FileDiffRange[] = [];
        console.info(files)

        files.forEach(file => {
            console.info(`Файл: ${file.to}`);

            let lastDiffLineNumber: number | null = null;
            let currentRange: FileDiffRange | null = null;

            file.chunks.forEach(chunk => {
                chunk.changes.forEach(change => {
                    if (change.type === "add" || change.type === "del") {
                        const lineNum: number = change.ln;

                        if (lineNum == null) return;

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
                        } else if (currentRange) {
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
    };
}
