import Component from "./Component";

type SwitchConfig = {
 initialState: boolean
};

export default class Switch extends Component {
    constructor(config: SwitchConfig) {
        super(config);
    }
}