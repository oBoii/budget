class GroupedExpense:
    def __init__(self, category: str, price_fabian: float, price_elisa: float):
        self.category = category
        self.price_fabian = price_fabian
        self.price_elisa = price_elisa

    def serialize(self) -> dict:
        return {
            'category': self.category,
            'price_fabian': self.price_fabian,
            'price_elisa': self.price_elisa,
        }
