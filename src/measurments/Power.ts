export default class Power {
    constructor(
        public apparent : number,
        public powerFactor : number
    ) {  }

    public get S() {
        return this.apparent;
    }

    public get P() {
        return this.apparent * this.powerFactor;
    }

    public get Q() {
        return this.P * Math.tan(this.angle);
    }

    public get angle() {
        return Math.acos(this.powerFactor);
    }
}