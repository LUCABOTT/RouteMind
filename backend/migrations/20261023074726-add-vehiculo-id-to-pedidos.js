
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pedidos', 'vehiculo_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'vehiculos',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('pedidos', 'vehiculo_id');
  },
};
