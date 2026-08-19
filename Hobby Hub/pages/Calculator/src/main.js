const display = document.getElementById("displayText");

let equation = "";

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// =========================
// DISPLAY / INPUT
// =========================

function append(char) {
    equation += char;
    display.value = equation;
}


function backspace() {
    equation = equation.slice(0, -1);
    display.value = equation;
}


function clearAll() {
    equation = "";
    display.value = "";
}


// =========================
// PERCENTAGE CALCULATOR
// =========================
//
// Examples:
//
// 200+20%       → 240
// 200-20%       → 160
// 200*20%       → 40
// 200/20%       → 1000
//
// Percentages remain visible in the equation until "=".
//


function convertPercentages(expression) {

    // Convert a standalone percentage:
    //
    // 20% → 0.2
    //
    expression = expression.replace(
        /(\d+(?:\.\d+)?)%/g,
        function(match, number) {
            return `(${Number(number) / 100})`;
        }
    );

    return expression;
}


function calculate() {

    try {

        if (!equation) return;

        let expression = equation;

        /*
         * Convert calculator-style percentages.
         *
         * We first handle:
         *
         * number + percent
         * number - percent
         *
         * because:
         *
         * 200 + 20% = 200 + (20% of 200)
         *             = 200 + 40
         *
         * 200 - 20% = 200 - 40
         */

        expression = expression.replace(
            /(\d+(?:\.\d+)?)([+\-])(\d+(?:\.\d+)?)%/g,
            function(match, base, operator, percent) {

                const value =
                    Number(base) * Number(percent) / 100;

                return `${base}${operator}${value}`;
            }
        );


        /*
         * Remaining percentages are normal decimals.
         *
         * Example:
         *
         * 200*10%
         *
         * becomes:
         *
         * 200*0.1
         *
         * Example:
         *
         * 200/10%
         *
         * becomes:
         *
         * 200/0.1
         */

        expression = convertPercentages(expression);


        /*
         * Evaluate the final expression.
         */

        const result = eval(expression);


        if (!Number.isFinite(result)) {
            throw new Error("Invalid calculation");
        }


        equation = String(result);

        display.value = equation;

    } catch (error) {

        equation = "";

        display.value = "Error";
    }
}


// =========================
// PLUS / MINUS
// =========================

function plusMinus() {

    if (!equation) return;

    try {

        const value = eval(
            convertPercentages(equation)
        );

        if (!Number.isFinite(value)) {
            throw new Error();
        }

        equation = String(-value);

        display.value = equation;

    } catch {

        display.value = "Error";
    }
}


// =========================
// PERCENT BUTTON
// =========================
//
// IMPORTANT:
//
// Unlike the previous version,
// this does NOT immediately convert
// the number.
//
// Example:
//
// 200 + 20
//
// Press %
//
// equation becomes:
//
// 200+20%
//
// The % remains visible.
//
// Then pressing = calculates it.
//


function percent() {

    if (!equation) return;


    /*
     * Don't add another % if the current
     * number already has one.
     */

    if (/%$/.test(equation)) {
        return;
    }


    /*
     * Find the last number in the equation.
     *
     * Examples:
     *
     * 200       → 200
     * 200+20    → 20
     * 200*10    → 10
     * 200/5     → 5
     */

    const match = equation.match(
        /(\d+(?:\.\d+)?)$/
    );


    if (!match) return;


    /*
     * Add % to the current number.
     */

    equation += "%";

    display.value = equation;
}


// =========================
// OPTIONAL: SAFE KEYBOARD
// =========================

document.addEventListener("keydown", function(event) {

    const key = event.key;


    // Numbers
    if (/^[0-9]$/.test(key)) {
        append(key);
        return;
    }


    // Decimal
    if (key === ".") {
        append(".");
        return;
    }


    // Operators
    if (["+", "-", "*", "/"].includes(key)) {
        append(key);
        return;
    }


    // Percentage
    if (key === "%") {
        percent();
        return;
    }


    // Enter / =
    if (key === "Enter" || key === "=") {
        calculate();
        return;
    }


    // Backspace
    if (key === "Backspace") {
        backspace();
        return;
    }


    // Escape = clear
    if (key === "Escape") {
        clearAll();
        return;
    }

});