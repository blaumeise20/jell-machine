import { generatorCell } from "./GeneratorCell";
import { moverCell } from "./MoverCell";
import { ccwRotatorCell, cwRotatorCell } from "./RotatorCell";
import { pushCell } from "./PushCell";
import { slideCell } from "./SlideCell";
import { enemyCell } from "./EnemyCell";
import { trashCell } from "./TrashCell";
import { wallCell } from "./WallCell";

export const builtinCells = [
    generatorCell,
    moverCell,
    cwRotatorCell,
    ccwRotatorCell,
    pushCell,
    slideCell,
    enemyCell,
    trashCell,
    wallCell,
];
