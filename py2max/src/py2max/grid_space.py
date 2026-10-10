

class IGridSpace:
    def compute_xy(self, X, Y) -> tuple[float, float]:
        raise NotImplemented()

    def compute_wh(self, W, H) -> tuple[float, float]:
        """
        Same as compute_xy, but for without applying the offset. (vector) Usefull to compute width and height
        :param W:
        :param H:
        :return:
        """
        raise NotImplemented()


class GridSpace(IGridSpace):
    def __init__(self, x0: float, y0: float, width: float, height: float) -> None:
        self.x0 = x0
        self.y0 = y0
        self.width = width
        self.height = height

    def compute_xy(self, X, Y) -> tuple[float, float]:
        x = X * self.width + self.x0
        y = Y * self.height + self.y0
        return float(round(x)), float(round(y))

    def compute_wh(self, W, H) -> tuple[float, float]:
        w = W * self.width
        h = H * self.height
        return float(round(w)), float(round(h))


class SkewedGridSpace(IGridSpace):
    def __init__(self, x0: float, y0: float, width: float, height: float) -> None:
        self.x0 = x0
        self.y0 = y0
        self.width = width
        self.height = height

    def compute_xy(self, X, Y) -> tuple[float, float]:
        x = X * self.width + self.x0
        y = (Y + X / 3) * self.height + self.y0
        return float(round(x)), float(round(y))

    def compute_wh(self, W, H) -> tuple[float, float]:
        w = W * self.width
        h = H * self.height
        return float(round(w)), float(round(h))