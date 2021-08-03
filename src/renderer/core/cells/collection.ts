import { CellType } from "../cell";
import { GeneratorCell } from "./GeneratorCell";
import { MoverCell } from "./MoverCell";
import { RotatorCell } from "./RotatorCell";
import { SlideCell } from "./SlideCell";
import { EnemyCell } from "./EnemyCell";
import { TrashCell } from "./TrashCell";
import { WallCell } from "./WallCell";

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
