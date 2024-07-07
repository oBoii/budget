from models.abstract_model import AbstractModel


class Trip(AbstractModel):
    def __init__(self, id: int, description: str, start_date: str, total_price_fabian: float, total_price_elisa: float):
        self.id = id
        self.description = description
        self.start_date = start_date
        self.total_price_fabian = total_price_fabian
        self.total_price_elisa = total_price_elisa

    def serialize(self):
        return {
            'id': self.id,
            'description': self.description,
            'start_date': self.start_date,
            'total_price_fabian': self.total_price_fabian,
            'total_price_elisa': self.total_price_elisa,
        }
