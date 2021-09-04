import { CellType } from "@core/cell";
import { generatorCell, GeneratorCell } from "./GeneratorCell";
import { moverCell, MoverCell } from "./MoverCell";
import { ccwRotatorCell, cwRotatorCell, RotatorCell } from "./RotatorCell";
import { pushCell } from "./PushCell";
import { slideCell, SlideCell } from "./SlideCell";
import { enemyCell, EnemyCell } from "./EnemyCell";
import { trashCell, TrashCell } from "./TrashCell";
import { wallCell, WallCell } from "./WallCell";

export const cellClasses = {
    [CellType.Generator ]: GeneratorCell,
    [CellType.Mover     ]: MoverCell    ,
    [CellType.CWrotator ]: RotatorCell  ,
    [CellType.CCWrotator]: RotatorCell  ,
    [CellType.Slide     ]: SlideCell    ,
    [CellType.Trash     ]: TrashCell    ,
    [CellType.Enemy     ]: EnemyCell    ,
    [CellType.Wall      ]: WallCell     ,
};

export const builtinCells = [
    generatorCell,
    moverCell,
    cwRotatorCell,
    ccwRotatorCell,
    pushCell,
    slideCell,
    trashCell,
    enemyCell,
    wallCell,
];
