from typing import Optional
import datetime


class Expense:
    def __init__(self, id: int, date: Optional[datetime.date], price_fabian: float, price_elisa: float, paid_by: str,
                 category: str, subcategory: str, description: str):
        self.id = id
        self.date = date
        self.price_fabian = price_fabian
        self.price_elisa = price_elisa
        self.paid_by = paid_by
        self.category = category
        self.subcategory = subcategory
        self.description = description

    def serialize(self) -> dict:
        return {
            'id': self.id,
            'date': self.date,
            'price_fabian': self.price_fabian,
            'price_elisa': self.price_elisa,
            'paid_by': self.paid_by,
            'category': self.category,
            'subcategory': self.subcategory,
            'description': self.description
        }
