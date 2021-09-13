import { execFile } from "child_process";
import { getLogger } from "./logger";
import { randomBytes } from "crypto";

let logger = getLogger();

/**
 * Converts a `child_process.execFile` call into a promise.
 *
 * If an error is reported by `execFile`, then the promise will be rejected.
 *
 * @param cmd {string}
 * @return {Promise<string>}
 */
export function execute(file:string, args:string[]) : Promise<string> {
    return new Promise((resolve, reject) => {
        //let env = {"DEBUG": "pw:api"}
        let env = {}
        execFile(file, args, {timeout: 10000, env: env}, (error:Error|null, stdout:string, stderr:string) => {
	    if (error) {
                reject(stderr);
	    } else {
                resolve(stdout? stdout : stderr);
            }
	});
    });
}

/**
 * Get a pseudorandom string.
 */
export function randomString() {
    return randomBytes(20).toString('hex');
}

