document.addEventListener("DOMContentLoaded", () => {
    const selectElements = document.querySelectorAll(".form-select");

    // Add event listeners to select elements
    selectElements.forEach(select => {
        select.addEventListener("change", updateUI);
    });

    // Initialize popovers for Bootstrap
    const popoverTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.forEach(popoverTriggerEl => {
        new bootstrap.Popover(popoverTriggerEl);
    });

    initialize(getUrlParameter("vector"), getUrlParameter("v"));
    updateUI();

    // Initialization logic
    function initialize(vector, v) {
        const partials = ["skill-level", "motive", "opportunity", "size", "ease-of-discovery", "ease-of-exploit", "awareness", "intrusion-detection", "loss-of-confidentiality", "loss-of-integrity", "loss-of-availability", "loss-of-accountability", "financial-damage", "reputation-damage", "non-compliance", "privacy-violation"];
        partials.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = 0;
        });

        if (/^\d+$/.test(v) && v.length === 16) {
            v.split("").forEach((value, index) => {
                const element = document.getElementById(partials[index]);
                if (element) element.value = parseInt(value, 10);
            });
        } else if (vector) {
            const values = vector.split("/");
            values.forEach(part => {
                const [key, value] = part.split(":");
                const element = document.getElementById(key.toLowerCase());
                if (element && !isNaN(value)) {
                    const numValue = parseInt(value, 10);
                    if (numValue >= 0 && numValue <= 9) {
                        element.value = numValue;
                    }
                }
            });
        }
    }

    // Update UI based on calculations
    function updateUI() {
        const data = calculateData();
        updateFactors(data);
        updateScore(data);
        updateRiskLevel(data);
    }

    // Perform all calculations and return as a structured object
    function calculateData() {
        const ids = ["skill-level", "motive", "opportunity", "size", "ease-of-discovery", "ease-of-exploit", "awareness", "intrusion-detection", "loss-of-confidentiality", "loss-of-integrity", "loss-of-availability", "loss-of-accountability", "financial-damage", "reputation-damage", "non-compliance", "privacy-violation"];
        const scores = ids.map(id => parseInt(document.getElementById(id)?.value, 10) || 0);

        const TAF = average(scores.slice(0, 4));
        const VF = average(scores.slice(4, 8));
        const TIF = average(scores.slice(8, 12));
        const BIF = average(scores.slice(12, 16));
        const LF = (TAF + VF) / 2;
        const IF = BIF || TIF;

        const score = `${ids.map(id => `${id.toUpperCase()}:${document.getElementById(id)?.value || 0}`).join("/")}`;
        const scorev = scores.join("");

        return { TAF, VF, TIF, BIF, LF, IF, score, scorev };
    }

    // Update factor-related elements
    function updateFactors({ TAF, VF, TIF, BIF, LF, IF }) {
        setFactor(TAF, "TAF");
        setFactor(VF, "VF");
        setFactor(TIF, "TIF");
        setFactor(BIF, "BIF");
        setFactor(LF, "LF");
        setFactor(IF, "IF");
    }

    // Update score elements
    function updateScore({ score, scorev }) {
        const scoreElement = document.getElementById("score");
        const scorevElement = document.getElementById("scorev");

        if (scoreElement) {
            scoreElement.textContent = score;
            scoreElement.setAttribute("href", `?vector=${encodeURIComponent(score)}`);
        }

        if (scorevElement) {
            scorevElement.textContent = scorev;
            scorevElement.setAttribute("href", `?v=${encodeURIComponent(scorev)}`);
        }
    }

    // Update risk level display
    function updateRiskLevel({ LF, IF }) {
        const riskClassMap = {
            Note: "info",
            Low: "primary",
            Medium: "warning",
            High: "danger",
            Critical: "danger"
        };

        const matrix = [
            ["Note", "Low", "Medium"],
            ["Low", "Medium", "High"],
            ["Medium", "High", "Critical"]
        ];
        const mLF = getRiskInNum(LF);
        const mIF = getRiskInNum(IF);

        const riskElement = document.getElementById("R");
        if (riskElement) {
            const parent = riskElement.closest(".card-body") || riskElement.parentElement;
            if (parent) {
                const riskLevel = matrix[mLF][mIF];
                const alertClass = `alert-${riskClassMap[riskLevel]}`;

                parent.className = parent.className.replace(/alert-\w+/g, "");
                parent.classList.add(alertClass);
                riskElement.textContent = riskLevel;
            }
        }
    }

    // Utility functions
    function setFactor(factor, sFactor) {
        const element = document.getElementById(sFactor);
        if (!element) return;

        const parent = element.closest(".card-body") || element.parentElement;
        if (!parent) return;

        parent.className = parent.className.replace(/alert-\w+/g, "");
        parent.classList.add(`alert-${getRiskClass(factor)}`);
        element.textContent = `${getRisk(factor)} (${sFactor}: ${factor})`;
    }

    function getRisk(score) {
        if (score === 0) return "Note";
        if (score < 3) return "Low";
        if (score < 6) return "Medium";
        return "High";
    }

    function getRiskClass(score) {
        if (score === 0) return "info";
        if (score < 3) return "primary";
        if (score < 6) return "warning";
        return "danger";
    }

    function getRiskInNum(score) {
        if (score < 3) return 0;
        if (score < 6) return 1;
        return 2;
    }

    function average(arr) {
        return arr.reduce((sum, num) => sum + num, 0) / arr.length;
    }

    function getUrlParameter(name) {
        const regex = new RegExp(`[?&]${name}=([^&#]*)`);
        const result = regex.exec(window.location.search);
        return result ? decodeURIComponent(result[1].replace(/\+/g, " ")) : "";
    }
});
